"use client";

import {
  BUY_HOMESTAY_CATEGORIES,
  listingInputSchema,
} from "@myrehat-task-b/api/validation/listing";
import { Button } from "@myrehat-task-b/ui/components/button";
import { Input } from "@myrehat-task-b/ui/components/input";
import { Label } from "@myrehat-task-b/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { orpc } from "@/utils/orpc";

type ListingFormValues = {
  title: string;
  price: string;
  location: string;
  category: string;
  whatsapp: string;
};

const defaultValues: ListingFormValues = {
  title: "",
  price: "",
  location: "",
  category: "",
  whatsapp: "",
};

const textFields = [
  { name: "title", label: "Title", placeholder: "Cozy 3-room homestay near the beach" },
  { name: "price", label: "Price", placeholder: "250000.50", inputMode: "decimal" },
  { name: "location", label: "Location", placeholder: "Kuantan, Pahang" },
  { name: "whatsapp", label: "WhatsApp", placeholder: "+60123456789", inputMode: "tel" },
] as const;

export default function CreateListingForm() {
  const router = useRouter();

  const createListing = useMutation(
    orpc.listing.create.mutationOptions({
      onSuccess: () => {
        toast.success("Listing created");
        router.push("/listings");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to create listing");
      },
    }),
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // The onSubmit validator has already passed; parse again to get the typed API input.
      await createListing.mutateAsync(listingInputSchema.parse(value)).catch(() => undefined);
    },
    validators: {
      onSubmit: listingInputSchema,
    },
  });

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Create Listing</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {textFields.map(({ name, label, placeholder, ...inputProps }) => (
          <form.Field key={name} name={name}>
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>{label}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder={placeholder}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  {...inputProps}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        ))}

        <form.Field name="category">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Category</Label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="h-8 w-full rounded-none border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="" disabled>
                  Select a category
                </option>
                {BUY_HOMESTAY_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isSubmitting || createListing.isPending}
            >
              {isSubmitting || createListing.isPending ? "Submitting..." : "Create Listing"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
