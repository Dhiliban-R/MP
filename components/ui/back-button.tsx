"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

const BackButton = ({ href, label = "Back", className }: BackButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    // Check if we can go back in history
    if (window.history.length > 1) {
      router.back();
    } else {
      // If no history, go to home
      router.push("/");
    }
  };

  if (href) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className={`flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white ${className || ''}`}
      >
        <Link href={href}>
          <ArrowLeft className="h-4 w-4" />
          <span>{label}</span>
        </Link>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleBack}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );
};

export default BackButton;
