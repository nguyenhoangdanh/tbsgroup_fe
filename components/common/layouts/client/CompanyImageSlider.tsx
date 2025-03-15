"use client"
import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

// Định nghĩa kiểu dữ liệu cho hình ảnh
interface ImageItem {
    id: number;
    src: string;
    fallbackSrc?: string; // URL dự phòng
    alt: string;
    caption: string;
}

const CompanyImageSlider = () => {
    // Dữ liệu mẫu hình ảnh công ty với ảnh dự phòng
    const images: ImageItem[] = [
        {
            id: 1,
            src: "/images/slider-01.jpg",
            fallbackSrc: "/api/placeholder/800/400",
            alt: "Trụ sở chính công ty",
            caption: "Trụ sở chính TBS Group"
        },
        {
            id: 2,
            src: "/images/slider-03.jpg",
            fallbackSrc: "/api/placeholder/800/400",
            alt: "Nhà máy sản xuất",
            caption: "Nhà máy sản xuất hiện đại"
        },
        {
            id: 3,
            src: "/images/slider-02.jpg",
            fallbackSrc: "/api/placeholder/800/400",
            alt: "Đội ngũ nhân viên",
            caption: "Đội ngũ chuyên nghiệp của chúng tôi"
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isLoading, setIsLoading] = useState<boolean[]>(Array(images.length).fill(true));
    const [imageErrors, setImageErrors] = useState<boolean[]>(Array(images.length).fill(false));
    const [isTransitioning, setIsTransitioning] = useState(false);
    const autoPlayRef = useRef<number | null>(null);
    const transitionTimeoutRef = useRef<number | null>(null);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Cài đặt có thể điều chỉnh
    const autoPlayInterval = 5000; // 5 giây mỗi slide
    const transitionDuration = 500; // 0.5 giây cho hiệu ứng chuyển

    // Tính toán chiều cao dựa trên tỷ lệ khung hình 16:9
    useEffect(() => {
        const updateSliderHeight = () => {
            if (!sliderRef.current) return;

            // Lấy chiều rộng hiện tại của container
            const containerWidth = sliderRef.current.clientWidth;

            // Tính toán chiều cao theo tỷ lệ 16:9 (9/16 = 0.5625)
            let height = containerWidth * 0.5625; // 56.25% của chiều rộng

            // Giới hạn chiều cao tối thiểu và tối đa
            if (height < 180) height = 180; // Tối thiểu 180px
            if (height > 550) height = 550; // Tối đa 550px

            // Đặt chiều cao dưới dạng pixel
            sliderRef.current.querySelector('.slider-container')?.setAttribute(
                'style',
                `height: ${height}px`
            );
        };

        // Cập nhật ngay khi component mount
        updateSliderHeight();

        // Thêm độ trễ nhỏ để đảm bảo kích thước được tính toán sau khi DOM đã render
        const timer = setTimeout(updateSliderHeight, 100);

        // Cập nhật khi thay đổi kích thước màn hình
        window.addEventListener('resize', updateSliderHeight);

        return () => {
            window.removeEventListener('resize', updateSliderHeight);
            clearTimeout(timer);
        };
    }, []);

    const goToSlide = (index: number) => {
        if (isTransitioning) return;

        setIsTransitioning(true);

        let newIndex = index;

        if (newIndex < 0) {
            newIndex = images.length - 1;
        } else if (newIndex >= images.length) {
            newIndex = 0;
        }

        setCurrentIndex(newIndex);

        // Đặt thời gian cho hiệu ứng chuyển tiếp
        transitionTimeoutRef.current = window.setTimeout(() => {
            setIsTransitioning(false);
        }, transitionDuration);
    };

    const nextSlide = () => {
        goToSlide(currentIndex + 1);
    };

    const prevSlide = () => {
        goToSlide(currentIndex - 1);
    };

    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (touchStart - touchEnd > 50) {
            // vuốt sang trái
            nextSlide();
        }

        if (touchStart - touchEnd < -50) {
            // vuốt sang phải
            prevSlide();
        }
    };

    const toggleAutoPlay = () => {
        setIsAutoPlaying(!isAutoPlaying);
    };

    const handleImageLoad = (index: number) => {
        setIsLoading(prev => {
            const newLoadingState = [...prev];
            newLoadingState[index] = false;
            return newLoadingState;
        });
    };

    const handleImageError = (index: number) => {
        setImageErrors(prev => {
            const newErrorState = [...prev];
            newErrorState[index] = true;
            return newErrorState;
        });

        setIsLoading(prev => {
            const newLoadingState = [...prev];
            newLoadingState[index] = false;
            return newLoadingState;
        });
    };

    // Xử lý phím mũi tên trái/phải
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [currentIndex]);

    // Tự động chuyển slide
    useEffect(() => {
        if (isAutoPlaying && !isTransitioning) {
            autoPlayRef.current = window.setInterval(() => {
                nextSlide();
            }, autoPlayInterval);
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [currentIndex, isAutoPlaying, isTransitioning]);

    // Dọn dẹp timeout khi component unmount
    useEffect(() => {
        return () => {
            if (transitionTimeoutRef.current) {
                clearTimeout(transitionTimeoutRef.current);
            }
        };
    }, []);

    // Tạm dừng tự động chuyển slide khi người dùng hover
    const handleMouseEnter = () => {
        if (autoPlayRef.current && isAutoPlaying) {
            clearInterval(autoPlayRef.current);
        }
    };

    const handleMouseLeave = () => {
        if (isAutoPlaying && !isTransitioning) {
            autoPlayRef.current = window.setInterval(() => {
                nextSlide();
            }, autoPlayInterval);
        }
    };

    // Hiển thị chỉ báo trang (bullets) dựa trên số lượng ảnh
    const renderBullets = () => {
        if (images.length <= 5) {
            // Nếu ít hơn hoặc bằng 5 ảnh, hiển thị tất cả bullets
            return images.map((_, index) => (
                <button
                    key={index}
                    className={`w-2 h-2 sm:w-3 sm:h-3 mx-1 rounded-full focus:outline-none transition-all duration-300 ${index === currentIndex
                        ? 'bg-green-600 scale-125'
                        : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Đến slide ${index + 1}`}
                    disabled={isTransitioning}
                />
            ));
        } else {
            // Nếu nhiều hơn 5 ảnh, chỉ hiển thị 5 bullets với logic hiển thị thông minh
            const bullets = [];
            for (let i = 0; i < 5; i++) {
                let indexToShow;
                if (i === 0) indexToShow = 0; // Bullet đầu tiên
                else if (i === 4) indexToShow = images.length - 1; // Bullet cuối cùng
                else {
                    // 3 bullets ở giữa
                    const middleRange = images.length - 2;
                    const step = middleRange / 3;
                    indexToShow = Math.round(step * (i - 1) + 1);
                }

                bullets.push(
                    <button
                        key={indexToShow}
                        className={`w-2 h-2 sm:w-3 sm:h-3 mx-1 rounded-full focus:outline-none transition-all duration-300 ${indexToShow === currentIndex
                            ? 'bg-green-600 scale-125'
                            : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                        onClick={() => goToSlide(indexToShow)}
                        aria-label={`Đến slide ${indexToShow + 1}`}
                        disabled={isTransitioning}
                    />
                );
            }
            return bullets;
        }
    };

    return (
        <div
            ref={sliderRef}
            className="relative w-full mx-auto overflow-hidden rounded-lg shadow-lg bg-white"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Tiêu đề slider */}
            <div className="bg-gradient-to-r from-green-600 to-blue-500 text-white py-2 px-4">
                <h3 className="text-base md:text-lg lg:text-xl font-semibold text-center md:text-left">
                    TBS Group - Giới thiệu công ty
                </h3>
            </div>

            {/* Main slider container với chiều cao thích ứng */}
            <div
                className="slider-container relative w-full overflow-hidden bg-gray-100"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Lớp mờ gradient để làm nổi bật các nút điều hướng */}
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent z-10"></div>
                <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent z-10"></div>

                {/* Images */}
                <div
                    className="flex transition-transform duration-500 ease-in-out h-full"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {images.map((image, index) => (
                        <div key={image.id} className="min-w-full h-full flex-shrink-0 relative">
                            {isLoading[index] && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                    <div className="animate-pulse flex flex-col items-center">
                                        <ImageIcon size={48} className="text-gray-400" />
                                        <p className="mt-2 text-gray-500">Đang tải...</p>
                                    </div>
                                </div>
                            )}

                            {/* Ảnh chính, với fallback nếu cần thiết */}
                            {imageErrors[index] && image.fallbackSrc ? (
                                <img
                                    src={image.fallbackSrc}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                    onLoad={() => handleImageLoad(index)}
                                />
                            ) : (
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    className="w-full h-full object-cover"
                                    onLoad={() => handleImageLoad(index)}
                                    onError={() => handleImageError(index)}
                                    style={{ opacity: isLoading[index] ? 0 : 1 }}
                                    width={1600}
                                    height={1000}
                                    priority={index === 0} // Ưu tiên tải ảnh đầu tiên
                                />
                            )}

                            {/* Hiển thị thông báo lỗi */}
                            {imageErrors[index] && !image.fallbackSrc && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                                    <div className="flex flex-col items-center text-red-500">
                                        <AlertTriangle size={48} />
                                        <p className="mt-2">Không thể tải hình ảnh</p>
                                    </div>
                                </div>
                            )}

                            {/* Caption với hiệu ứng gradient */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-2 md:p-4">
                                <div className="bg-black bg-opacity-50 rounded p-2">
                                    <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium">{image.caption}</p>
                                    <p className="text-xs opacity-80">{`${index + 1}/${images.length}`}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation arrows - Lớn hơn và có hiệu ứng hover */}
                <button
                    className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full p-2 
                               hover:bg-opacity-80 focus:outline-none transition-all duration-300 
                               opacity-70 hover:opacity-100 hover:scale-110 z-20"
                    onClick={prevSlide}
                    aria-label="Slide trước"
                    disabled={isTransitioning}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full p-2 
                               hover:bg-opacity-80 focus:outline-none transition-all duration-300 
                               opacity-70 hover:opacity-100 hover:scale-110 z-20"
                    onClick={nextSlide}
                    aria-label="Slide tiếp theo"
                    disabled={isTransitioning}
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* Controls and indicators */}
            <div className="flex items-center justify-between p-2 bg-gray-200">
                {/* Dots indicator - được tối ưu hóa cho số lượng ảnh nhỏ */}
                <div className="flex items-center justify-center flex-grow">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            className={`w-3 h-3 mx-1.5 rounded-full focus:outline-none transition-all duration-300 ${index === currentIndex
                                ? 'bg-green-600 scale-125'
                                : 'bg-gray-300 hover:bg-gray-400'
                                }`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Đến slide ${index + 1}`}
                            disabled={isTransitioning}
                        />
                    ))}
                </div>

                {/* Auto-play control */}
                <button
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs md:text-sm transition-all duration-300 ${isAutoPlaying ? 'bg-green-600 text-white' : 'bg-gray-300 text-black'
                        }`}
                    onClick={toggleAutoPlay}
                >
                    {isAutoPlaying ? (
                        <>
                            <Pause size={16} />
                            <span className="hidden sm:inline">Tạm dừng</span>
                        </>
                    ) : (
                        <>
                            <Play size={16} />
                            <span className="hidden sm:inline">Tự động</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CompanyImageSlider;