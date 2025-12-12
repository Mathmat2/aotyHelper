'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { ModeToggle } from "@/components/mode-toggle"

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  limit: z.string(),
  includeEPs: z.boolean(),
})

export default function Home() {
  const router = useRouter()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      limit: "9",
      includeEPs: false,
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const params = new URLSearchParams({
      username: data.username,
      limit: data.limit,
    });

    if (data.includeEPs) {
      params.append('includeEPs', 'true');
    }

    router.push(`/albums?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <main className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <div className="mb-8">
            <Image
              src="/aoty-logo.png"
              alt="Album of the Year Logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LastFM Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grid Size</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grid size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="9">3x3 (9)</SelectItem>
                      <SelectItem value="16">4x4 (16)</SelectItem>
                      <SelectItem value="25">5x5 (25)</SelectItem>
                      <SelectItem value="40">5x8 (40)</SelectItem>
                      <SelectItem value="42">Topster (42)</SelectItem>
                      <SelectItem value="49">7x7 (49)</SelectItem>
                      <SelectItem value="100">10x10 (100)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeEPs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Include EPs
                    </FormLabel>
                    <FormDescription>
                      Include EPs alongside albums in your collection
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white">
              Generate
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
