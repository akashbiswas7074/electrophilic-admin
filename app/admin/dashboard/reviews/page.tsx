import React from "react";
import { Star } from "lucide-react";

import { getLatestProductReviews } from "@/lib/database/actions/admin/products/products.actions";
import SwitchComponent from "@/components/admin/dashboard/reviews/switch";
const ReviewsPage = async () => {
  const all_reviews = await getLatestProductReviews();
  const reviews = all_reviews?.reviews;

  if (!reviews) return <p>No reviews found.</p>;
  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-6">Latest Reviews</h1>
      <div className="space-y-4">
        {reviews.map((reviewData: any, index: number) => {
          const { productName, productDescription, review, productImage } =
            reviewData;
          const {
            rating,
            review: comment,
            reviewCreatedAt,
            reviewBy,
            verified,
            _id,
          } = review;
          const { username, email, image } = reviewBy;

          return (
            <div key={index} className="border-b-2 pb-4 last:border-0">
              <div className="flex gap-[10px]">
                <div className="">
                  <img
                    src={productImage[0].url}
                    alt="_"
                    className="w-[100px] object-cover"
                  />
                </div>
                <div className="">
                  {/* Product Information */}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">{productName}</h2>
                    <p className="text-gray-600">{productDescription}</p>
                  </div>

                  {/* Review Rating */}
                  <div className="flex mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 border-none ${
                          i < rating
                            ? "border-none fill-yellow-400"
                            : "stroke-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review Comment */}
                  <p className="mb-2">{comment}</p>

                  {/* Reviewer Details */}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <img
                        src={image}
                        alt={username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{username || email}</span>
                      <span>|</span>
                      <span>
                        {new Date(reviewCreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <SwitchComponent _id={_id} verified={verified} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewsPage;
