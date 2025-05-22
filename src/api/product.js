import axios from 'axios';

export const getProductCount = async () => {
  try {
    const response = await axios.get('/api/products/count');
    return response.data.count;
  } catch (error) {
    throw error;
  }
};