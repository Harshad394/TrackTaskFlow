import {email, z} from "zod"

export const registerSchema = z.object({
    name:z.string()
    .min(2,"Name should be atleast 2 letters")
    .max(50, "Name should not exceed 50 characters"),

    email:z.string().email("email should be in valid format"),

    password:z.string()
    .min(8,"password should be atleast 8 letters")
    .regex(/[A-Z]/,"password must contain atleast one capital letter")
    .regex(/[a-z]/,"password must contain atleast one small letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&#]/, "Password must contain at least one special character"),

   role: z.enum(["user", "admin"]).optional(),
})

export const loginSchema = z.object({
     email:z.string().email("email should be in valid format"),
    password:z.string()
    .min(8,"password should be atleast 8 letters")   
})