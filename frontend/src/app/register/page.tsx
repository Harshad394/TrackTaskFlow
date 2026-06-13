"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useRegister } from "../../features/auth/hooks/useRegister";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Layers } from "lucide-react";

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(50, { message: "Name must not exceed 50 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter." })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter." })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[@$!%*?&#]/, { message: "Password must contain at least one special character." }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    registerMutation.mutate(data, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (err: any) => {
        const backendMessage = err.response?.data?.message;
        const backendErrors = err.response?.data?.errors;

        if (Array.isArray(backendErrors) && backendErrors.length > 0) {
          const joinedErrors = backendErrors.map((e) => e.message).join(". ");
          setError(`Validation failed: ${joinedErrors}`);
        } else {
          setError(backendMessage || "Failed to create account. Please try again.");
        }
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        <Layers className="h-8 w-8 text-blue-600" />
        TrackTaskFlow
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              id="name"
              label="Full Name"
              placeholder="John Doe"
              autoComplete="name"
              {...register("name")}
              error={errors.name?.message}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              {...register("email")}
              error={errors.email?.message}
            />
            <div className="space-y-1">
              <Input
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                error={errors.password?.message}
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal px-1">
                Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#).
              </p>
            </div>
            <Button type="submit" className="w-full mt-2" isLoading={registerMutation.isPending}>
              Sign Up
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
