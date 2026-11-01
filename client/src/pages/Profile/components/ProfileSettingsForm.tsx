import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone, Save, Shield, User } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuthStore } from "../../../store/useAuthStore";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name cannot exceed 80 characters"),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || /^(\+?84|0)[35789]\d{8}$/.test(val),
      "Invalid Vietnamese phone number (e.g. 0912345678)",
    ),
  address: z
    .string()
    .trim()
    .max(500, "Shipping address cannot exceed 500 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsForm() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfile({
        name: values.name,
        phone: values.phone || undefined,
        address: values.address,
      });
      toast.success(
        "Your profile, phone number, and shipping address have been updated!",
      );
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(msg);
    }
  };

  if (!user) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b0b0f] p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-lg font-black uppercase text-white">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black uppercase tracking-wide text-white">
                {user.name}
              </h2>
              <span className="rounded-full bg-brand/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                {user.role}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              Update your delivery phone number and shipping address for faster
              checkout
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="mt-6 space-y-5"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Full Name */}
          <div>
            <label
              htmlFor="profile-name"
              className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
            >
              <User className="h-3.5 w-3.5 text-brand" />
              <span>Full Name</span>
            </label>
            <input
              id="profile-name"
              type="text"
              placeholder="Enter your full name"
              {...register("name")}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Email (Read-only display) */}
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300">
              <Mail className="h-3.5 w-3.5 text-brand" />
              <span>Email Address</span>
            </label>
            <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-400">
              <span className="truncate">
                {user.email || "Not linked to email"}
              </span>
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-400">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label
            htmlFor="profile-phone"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
          >
            <Phone className="h-3.5 w-3.5 text-brand" />
            <span>Phone Number (For Order Delivery)</span>
          </label>
          <input
            id="profile-phone"
            type="tel"
            placeholder="0912345678"
            {...register("phone")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>
          )}
        </div>

        {/* Shipping Address */}
        <div>
          <label
            htmlFor="profile-address"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-300"
          >
            <MapPin className="h-3.5 w-3.5 text-brand" />
            <span>Default Shipping Address</span>
          </label>
          <textarea
            id="profile-address"
            rows={3}
            placeholder="Enter your house number, street, ward/commune, district, city/province..."
            {...register("address")}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/70 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
          {errors.address && (
            <p className="mt-1 text-xs text-red-400">
              {errors.address.message}
            </p>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "Saving..." : "Save Profile Info"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

