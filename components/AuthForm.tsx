"use client" // This file is a client-side file because it uses button form and all that are client-side only

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import FormField from "./FormField"
import { useRouter } from "next/navigation"

// const formSchema = z.object({
//     name: z.string().min(2).max(50),
//     email: z.string().email(),
//     password: z.string().min(3).max(50),
// })

const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ?
            z.string().min(3).max(50) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(3).max(50),
    })
}

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const formschema = authFormSchema(type);
    const form = useForm<z.infer<typeof formschema>>({
        resolver: zodResolver(formschema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })
    function onSubmit(values: z.infer<typeof formschema>) {
        // Do something with the form values.
        // ✅ This will be type-safe and validated.
        try {
            if (type === 'sign-up') {
                // console.log("Sign up", values);
                toast.success('Account created sucessfully. Please sign in')
                router.push('/sign-in')
            } else {
                // console.log("sign in", values);
                toast.success('sign in successfully');
                router.push('/')
            }
        } catch (error) {
            console.log(error)
            toast.error('there was an error')
        }
        console.log(values)
    }

    const isSignIn = type === "sign-in";
    const isSignUp = type === "sign-up";
    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src='/logo.svg' alt='logo' height={32} width={38} />
                    <h2 className="text-primary-100">PrepWise</h2>
                </div>
                <h3>Practice job inteview with AI</h3>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full mt-4 form">
                        {!isSignIn && (
                            <FormField
                                control={form.control}
                                name="name"
                                label="Username"
                                placeholder="Your Name"
                                type="text"
                            />
                        )}
                        <FormField
                            control={form.control}
                            name="email"
                            label="Email"
                            placeholder="Your email address"
                            type="email"
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            type="password"
                        />
                        <Button className="btn" type="submit">{isSignIn ? 'Sign in' : 'Create an Account'}</Button>
                    </form>
                </Form>
                <p className="text-center">
                    {isSignIn ? "Don't have an account?" : "Already have an account?"}
                    <Link href={!isSignIn ? '/sign-in' : 'sign-up'} className="font-bold text-user-primary ml-1">
                        {!isSignIn ? 'Sign up' : 'Sign in'}
                    </Link>
                </p>
            </div>
        </div>

    )
}

export default AuthForm
