"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { MonitorPlay } from "lucide-react";

const IeltsPage = () => {
  const router = useRouter();

  const handleStartMock = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      router.push("/ielts/mock-exam");
    } catch (err) {
      console.error("Fullscreen error:", err);
      router.push("/ielts/mock-exam");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-textprimary mb-8">
          Welcome to Lever Mock Exam
        </h1>

        <div className="flex justify-center">
          <Button
            onClick={handleStartMock}
            className="h-14 px-8 text-white text-lg font-bold rounded-xl bg-primary hover:scale-105 transition-transform duration-200 shadow-lg flex items-center gap-3"
          >
            <MonitorPlay className="w-6 h-6" />
            IELTS Mock
          </Button>
        </div>

        <p className="text-textsecondary text-sm max-w-md mx-auto mt-4">
          Clicking the button will enter full-screen mode and start the mock
          exam session.
        </p>
      </div>
    </div>
  );
};

export default IeltsPage;
