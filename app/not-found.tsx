"use client"
// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative isolate">
            {/* Background Gradient */}
            <div
                className="absolute inset-0 -z-10 bg-gradient-to-br from-background via-muted/5 to-background opacity-20"
                aria-hidden="true"
            />

            {/* Main Content */}
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* 404 Numbers with CSS Animation */}
                <div className="flex justify-center gap-2 text-8xl font-bold">
                    <span className="text-primary animate-float">4</span>
                    <span className="text-destructive animate-pulse-slow">0</span>
                    <span className="text-primary animate-float-delay">4</span>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-destructive">
                        Trang không tồn tại
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Xin lỗi, chúng tôi không thể tìm thấy trang bạn yêu cầu
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        asChild
                        variant="outline"
                        className="gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                        <Link href="#" onClick={() => router.back()}>
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="gap-2 transition-transform hover:scale-[1.02] active:scale-95"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4" />
                            Trang chủ
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Subtle Grid Pattern */}
            <div
                className="absolute inset-0 -z-20 opacity-10 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
                aria-hidden="true"
            >
                <div className="absolute inset-0 bg-[url(/grid.svg)] bg-[size:20px_20px] bg-repeat" />
            </div>

            <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float 3s ease-in-out 0.3s infinite;
        }
        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    )
}