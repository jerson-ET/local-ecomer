

interface Product {
    id: string
    name: string
    image: string
    price: number
    bgColor: string
    originalPrice?: number
    discount?: number
    rating?: number
    reviews?: string
}

interface InfiniteCarouselProps {
    products: Product[]
}

export function InfiniteCarousel({ products }: InfiniteCarouselProps) {
    // Triple the products to ensure smooth infinite scrolling even on wider screens
    // We use 4 sets to be safe and scroll 25%
    const carouselItems = [...products, ...products, ...products, ...products]

    return (
        <div className="infinite-carousel-container">
            <div className="infinite-carousel-track">
                {carouselItems.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="carousel-item">
                        <div
                            className="carousel-image-wrapper"
                            style={{ backgroundColor: product.bgColor }}
                        >
                            <img src={product.image} alt={product.name} />
                        </div>
                        <div className="carousel-info">
                            <p className="carousel-name">{product.name}</p>
                            <p className="carousel-price">${product.price.toFixed(2)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
