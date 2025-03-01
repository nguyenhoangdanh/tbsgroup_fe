import MainLayout from "@/components/common/layouts/client/MainLayout";
import RedirectButton from "@/components/RedirectButton";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Video } from "lucide-react";
import Image from "next/image";

export default function Home() {
    return (
        <MainLayout title="Home">
            <div className="w-full">
                <div className="hero-section w-full h-full">
                    <div className="w-full flex flex-col items-center justify-center max-w-4xl mx-auto">
                        {/* <div className="rounded-full flex items-center bg-white border font-medium gap-1 text-sm h-auto p-2 bg-muted max-w-80">
                            <div className="p-2 h-5 shrink-0 flex items-center text-xs justify-center text-white bg-primary rounded-full">
                                New
                            </div>
                            Subscribe to Hoang Danh Nguyen
                            <ChevronRight className="w-4 h-4" />
                        </div> */}

                        <div className="flex flex-col mt-5 items-center text-center">
                            <h1 className="text-6xl font-black">
                                <p className="mt-1">
                                    <span className="bg-gradient-to-r from-primary via-purple-300 to-primary bg-clip-text text-transparent animate-sparkle">
                                        AI Powered
                                    </span>
                                    {"  "}
                                    Formy Builder
                                </p>
                            </h1>
                            <p className=" block text-lg mt-3 max-w-2xl mx-auto w-full font-medium text-black/70">
                                Create beautiful forms and share them anywhere. It takes
                                seconds,with our built in powered AI
                            </p>
                            <br />
                            <div className="flex items-center gap-2">
                                <RedirectButton
                                    name="Get Started"
                                    redirect="/login"
                                    icon={<ExternalLink className="w-4 h-4" />}
                                    positionIcon="right"
                                    className="h-12 text-base font-medium min-w-32"
                                />
                                <Button
                                    variant="outline"
                                    className="h-12  border-primary text-primary text-base font-medium min-w-32"
                                    asChild
                                >
                                    <a className="flex items-center gap-1">
                                        <Video size="17px" />
                                        Watch video
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* <div className="w-full relative max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
                        <div className="absolute top-15 left-1/2 transform -translate-x-1/2 w-full h-[200px] bg-gradient-to-r from-primary to-green-300 rounded-full blur-3xl opacity-40 z-0" />
                        <div className="w-full h-[400px] md:h-[500px] lg:h-[580px] rounded-xl shadow-lg bg-transparent">
                            <div className="relative w-full h-full rounded-md">
                                <Image
                                    src="/images/remove-bg-logo.png"
                                    alt="Formy AI dashboard"
                                    fill
                                    className="object-contain w-full h-full rounded-md"
                                />
                            </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </MainLayout>

    );
}
