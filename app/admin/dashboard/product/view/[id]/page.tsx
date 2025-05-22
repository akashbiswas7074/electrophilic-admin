"use client";
import { useEffect, useState } from "react";
import { getEntireProductById } from "@/lib/database/actions/admin/products/products.actions";
import {
  Container,
  Title,
  Text,
  SimpleGrid,
  Image,
  Badge,
  Group,
  Paper,
  Loader,
  Alert,
  Divider,
  List,
  ThemeIcon,
  Accordion,
} from "@mantine/core";
import { IconCircleCheck, IconX, IconPhoto, IconTag, IconCategory, IconBrandProducthunt, IconListDetails, IconSparkles, IconAtom2, IconMessageCircle, IconStar, IconShoppingCart, IconTruckDelivery, IconDimensions } from "@tabler/icons-react";
import { useParams } from "next/navigation";

const ProductViewPage = () => {
  const params = useParams();
  const idFromParams = params?.id;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const productId = Array.isArray(idFromParams) ? idFromParams[0] : idFromParams;
    if (productId) {
      const fetchProduct = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getEntireProductById(productId as string);
          if (result && result.success) {
            setProduct(result.product);
          } else {
            setError(result?.message || "Failed to fetch product details.");
          }
        } catch (err: any) {
          setError(err.message || "An error occurred while fetching product details.");
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [idFromParams]);

  if (loading) {
    return (
      <Container className="flex justify-center items-center h-[80vh]">
        <Loader size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert title="Error" color="red" icon={<IconX />}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container>
        <Text>Product not found.</Text>
      </Container>
    );
  }

  const renderSubProductDetails = (subProduct: any, index: number) => (
    <Paper p="md" shadow="xs" key={index} className="mb-4">
      <Title order={4} className="mb-2">Style {index + 1} {subProduct.sku && `(SKU: ${subProduct.sku})`}</Title>
      {subProduct.discount > 0 && (
        <Badge color="red" variant="filled" className="mb-2">
          {subProduct.discount}% OFF
        </Badge>
      )}
      <Text size="sm" className="mb-2"><strong>Images:</strong></Text>
      {subProduct.images && subProduct.images.length > 0 ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md" className="mb-2">
          {subProduct.images.map((img: any, imgIdx: number) => (
            <Image key={imgIdx} src={img.url} alt={`${product.name} - style ${index + 1} - image ${imgIdx + 1}`} radius="md" fit="contain" h={100} />
          ))}
        </SimpleGrid>
      ) : (
        <Text size="sm" c="dimmed">No images for this style.</Text>
      )}
      
      <Text size="sm" className="mb-1"><strong>Sizes & Stock:</strong></Text>
      {subProduct.sizes && subProduct.sizes.length > 0 ? (
      <List size="sm" spacing="xs" className="mb-2">
        {subProduct.sizes.map((s: any, sIdx: number) => (
          <List.Item key={sIdx} icon={<IconDimensions size={16} />}>
            Size: {s.size} - Price: ₹{s.price.toFixed(2)} - Qty: {s.qty} - Sold: {s.sold || 0}
          </List.Item>
        ))}
      </List>
      ) : (
         <Text size="sm" c="dimmed">No sizes defined for this style.</Text>
      )}
      <Text size="sm"><strong>Total Sold for this style:</strong> {subProduct.sold || 0}</Text>
    </Paper>
  );

  return (
    <Container fluid p="lg">
      <Paper p="xl" shadow="md" radius="md">
        <Group justify="space-between" align="flex-start" className="mb-6">
          <div>
            <Title order={1} className="mb-2">{product.name}</Title>
            <Text c="dimmed" className="mb-2">Slug: {product.slug}</Text>
          </div>
          <Badge color={product.featured ? "green" : "gray"} variant="light" size="lg">
            {product.featured ? "Featured" : "Not Featured"}
          </Badge>
        </Group>

        <Divider my="lg" />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <div>
            <Accordion defaultValue={["description"]} multiple>
              <Accordion.Item value="description">
                <Accordion.Control icon={<IconListDetails size={20} />}>Description</Accordion.Control>
                <Accordion.Panel>
                  <Text className="mb-2">{product.description}</Text>
                  {product.longDescription && (
                    <>
                      <Title order={5} className="mt-4 mb-1">Detailed Description:</Title>
                      <div dangerouslySetInnerHTML={{ __html: product.longDescription }} />
                    </>
                  )}
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="brandCategory">
                <Accordion.Control icon={<IconBrandProducthunt size={20} />}>Brand & Category</Accordion.Control>
                <Accordion.Panel>
                  {product.brand && <Text className="mb-1"><strong>Brand:</strong> {product.brand}</Text>}
                  {product.category && <Text className="mb-1"><strong>Category:</strong> {product.category?.name || "N/A"}</Text>}
                  {product.subCategories && product.subCategories.length > 0 && (
                    <>
                      <Text className="mt-2 mb-1"><strong>Sub-Categories:</strong></Text>
                      <List size="sm" spacing="xs">
                        {product.subCategories.map((subCat: any) => (
                          <List.Item key={subCat._id} icon={<IconCategory size={16} />}>{subCat.name}</List.Item>
                        ))}
                      </List>
                    </>
                  )}
                </Accordion.Panel>
              </Accordion.Item>

              {product.details && product.details.length > 0 && (
                <Accordion.Item value="details">
                  <Accordion.Control icon={<IconListDetails size={20} />}>Additional Details</Accordion.Control>
                  <Accordion.Panel>
                    <List size="sm" spacing="xs">
                      {product.details.map((detail: any, idx: number) => (
                        <List.Item key={idx}><strong>{detail.name}:</strong> {detail.value}</List.Item>
                      ))}
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {product.benefits && product.benefits.length > 0 && (
                <Accordion.Item value="benefits">
                  <Accordion.Control icon={<IconSparkles size={20} />}>Benefits</Accordion.Control>
                  <Accordion.Panel>
                    <List size="sm" spacing="xs">
                      {product.benefits.map((benefit: any, idx: number) => (
                        <List.Item key={idx} icon={<ThemeIcon color="teal" size={18} radius="xl"><IconCircleCheck size={12} /></ThemeIcon>}>{benefit.name}</List.Item>
                      ))}
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>
              )}

              {product.ingredients && product.ingredients.length > 0 && (
                <Accordion.Item value="ingredients">
                  <Accordion.Control icon={<IconAtom2 size={20} />}>Ingredients</Accordion.Control>
                  <Accordion.Panel>
                    <List size="sm" spacing="xs">
                      {product.ingredients.map((ingredient: any, idx: number) => (
                        <List.Item key={idx}>{ingredient.name}</List.Item>
                      ))}
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>
              )}
            </Accordion>
          </div>

          <div>
            <Title order={3} className="mb-4">Product Variants/Styles</Title>
            {product.subProducts && product.subProducts.length > 0 ? (
              product.subProducts.map(renderSubProductDetails)
            ) : (
              <Text c="dimmed">No sub-products or styles defined.</Text>
            )}
          </div>
        </SimpleGrid>

        <Divider my="lg" />

        <Title order={3} className="mb-4">Reviews</Title>
        {product.reviews && product.reviews.length > 0 ? (
          <List spacing="md">
            {product.reviews.map((review: any, idx: number) => (
              <List.Item
                key={idx}
                icon={
                  <ThemeIcon color={review.verified ? "green" : "yellow"} size={24} radius="xl">
                    {review.verified ? <IconCircleCheck size={16} /> : <IconMessageCircle size={16} />}
                  </ThemeIcon>
                }
              >
                <Paper p="sm" shadow="xs" radius="md" withBorder>
                  <Group justify="space-between">
                    <Text fw={500}>{review.reviewBy?.name || "Anonymous User"}</Text>
                    <Badge color={review.verified ? "green" : "yellow"} variant="light">
                      {review.verified ? "Verified" : "Pending"}
                    </Badge>
                  </Group>
                  <Group>
                    {[...Array(5)].map((_, i) => (
                      <IconStar key={i} size={16} color={i < review.rating ? "orange" : "gray"} fill={i < review.rating ? "orange" : "transparent"}/>
                    ))}
                  </Group>
                  <Text size="sm" c="dimmed" mt={4}>{new Date(review.reviewCreatedAt).toLocaleDateString()}</Text>
                  <Text mt="xs">{review.review}</Text>
                </Paper>
              </List.Item>
            ))}
          </List>
        ) : (
          <Text c="dimmed">No reviews yet for this product.</Text>
        )}

        <Divider my="lg" />
        
        <Group justify="flex-end">
            <Text size="xs" c="dimmed">Product ID: {product._id}</Text>
            <Text size="xs" c="dimmed">Last Updated: {new Date(product.updatedAt).toLocaleString()}</Text>
        </Group>

      </Paper>
    </Container>
  );
};

export default ProductViewPage;
