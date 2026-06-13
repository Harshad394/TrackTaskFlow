import mongoose from "mongoose";
import User from "../models/user.model.js";
import { IProject } from "../models/project.model.js";

/**
 * Extract raw @mention tokens from a comment body.
 *
 * Matches two formats:
 *   1. @email   — e.g. @alice@acme.com
 *   2. @word    — e.g. @alice  (matches until whitespace or punctuation that isn't part of a name)
 *
 * Returns the token text WITHOUT the leading @.
 */
export const extractMentionTokens = (body: string): string[] => {
  // Email-style mention:  @localpart@domain.tld
  const emailMentionRe = /@([\w.+-]+@[\w-]+\.[\w.]+)/g;
  // Word-style mention:   @word  (letters, digits, dots, hyphens, underscores)
  const wordMentionRe  = /@([\w.\-]+)/g;

  const tokens = new Set<string>();

  let match: RegExpExecArray | null;

  // Email mentions first — they are more specific
  while ((match = emailMentionRe.exec(body)) !== null) {
    tokens.add(match[1].toLowerCase());
  }

  // Word mentions for everything that wasn't an email mention
  while ((match = wordMentionRe.exec(body)) !== null) {
    const token = match[1].toLowerCase();
    // Skip if this token is actually the local-part of an already-captured email mention
    const alreadyCaptured = [...tokens].some((t) => t.startsWith(token + "@") || t === token);
    if (!alreadyCaptured) {
      tokens.add(token);
    }
  }

  return [...tokens];
};

/**
 * Given a comment body and a project, resolve @mention tokens to user ObjectIds.
 *
 * Resolution order per token:
 *   1. Exact email match against project members          (highest precision)
 *   2. Case-insensitive name prefix match                 (fallback)
 *
 * Only project members are considered — mentions of non-members are silently ignored.
 * The comment author is excluded from the result (they don't notify themselves).
 *
 * @returns Array of unique ObjectIds of resolved mentionees.
 */
export const resolveMentions = async (
  body:      string,
  project:   IProject,
  authorId:  string
): Promise<mongoose.Types.ObjectId[]> => {
  const tokens = extractMentionTokens(body);
  if (tokens.length === 0) return [];

  // Load all project member users in one query
  const memberIds = project.members.map((m) => m.userId);
  const members   = await User.find({ _id: { $in: memberIds } }).select("name email");

  const mentionedIds = new Set<string>();

  for (const token of tokens) {
    // 1. Exact email match
    const byEmail = members.find((u) => u.email === token);
    if (byEmail) {
      if (byEmail._id.toString() !== authorId) {
        mentionedIds.add(byEmail._id.toString());
      }
      continue;
    }

    // 2. Case-insensitive name prefix match (first match wins)
    const tokenLower = token.toLowerCase();
    const byName = members.find((u) =>
      u.name.toLowerCase().startsWith(tokenLower) ||
      u.name.toLowerCase().replace(/\s+/g, "").startsWith(tokenLower)
    );
    if (byName && byName._id.toString() !== authorId) {
      mentionedIds.add(byName._id.toString());
    }
  }

  return [...mentionedIds].map((id) => new mongoose.Types.ObjectId(id));
};
