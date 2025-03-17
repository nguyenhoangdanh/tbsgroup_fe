"use client";
import CompanyImageSlider from "@/components/common/layouts/client/CompanyImageSlider";
import React from "react";

export default function Home() {
    return (
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
                        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black">
                            <p className="mt-1">
                                <span className="bg-gradient-to-r from-primary via-green-800 to-primary bg-clip-text text-transparent animate-sparkle">
                                    TỔ HỢP TÚI XÁCH THOẠI SƠN
                                </span>
                                {"  "}
                            </p>
                        </h1>
                        <p className=" block text-lg mt-3 max-w-2xl mx-auto w-full font-medium ">
                            Các giá trị cốt lõi, cấu trúc doanh nghiệp, cột mốc, thành tựu và đóng góp to lớn của nhà điều hành là tiền đề, động lực cho sự phát triển chung cho một tương lai vững mạnh của TBS.
                        </p>
                        <br />
                        <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-between">
                            <img src="https://www.tbsgroup.vn/wp-content/uploads/2014/12/about-landing-image-1.png" alt="about-landing-image-1"></img>
                            <div className="w-full flex flex-col gap-2 items-start">
                                <h2 className="text-2xl font-black">
                                    <strong>CẤU TRÚC CÔNG TY</strong>
                                </h2>
                                <p>
                                    TBS đầu tư và phát triển 6 lĩnh vực chính, bao gồm: Da giày, Túi xách, Đầu tư và quản lí Bất động sản và Hạ tầng công nghiệp, Cảng &amp; Logistics, Thương mại &amp; Dịch vụ. Mỗi ngành nghề đều có những thành tích, thành công đáng kể góp phần quan trọng vào sự phát triển vững mạnh của công ty.
                                </p>
                            </div>
                        </div>

                        {/* <div className="flex items-center gap-2">
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
                        </div> */}
                    </div>
                </div>
                {/* <div className="w-full relative max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
                    <div className="absolute top-15 left-1/2 transform -translate-x-1/2 w-full h-[200px] bg-gradient-to-r from-primary to-green-300  blur-3xl opacity-40 z-0" />
                    <div className="w-full h-[400px] md:h-[500px] lg:h-[580px]  shadow-lg bg-transparent">
                        <div className="relative">
                            <Image
                                src="/images/remove-bg-logo.png"
                                alt="Formy AI dashboard"
                                className="object-contain"
                                width={400}
                                height={100}
                            />
                        </div>
                    </div>
                </div> */}
            </div>
        </div>

    );
}