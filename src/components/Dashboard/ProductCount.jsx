import React, { useEffect, useState } from 'react';
import { Card, Typography } from '@mui/material';
import { getProductCount } from '../../api/product';

const ProductCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const total = await getProductCount();
        setCount(total);
      } catch (error) {
        console.error('Error fetching product count:', error);
      }
    };
    fetchCount();
  }, []);

  return (
    <Card sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="h6">Total Products</Typography>
      <Typography variant="h3">{count}</Typography>
    </Card>
  );
};

export default ProductCount;
