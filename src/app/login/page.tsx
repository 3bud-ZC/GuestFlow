import { LoginForm } from "./LoginForm";
import { BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            GuestFlow
          </h2>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        
        <Card className="shadow-lg border-slate-200/60">
          <CardContent className="pt-8 pb-8 px-8">
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
