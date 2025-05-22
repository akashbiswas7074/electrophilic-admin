import React from 'react';
import { Grid,} from '@material-ui/core';
import ProductCount from '../components/Dashboard/ProductCount';

const Dashboard = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <ProductCount />
      </Grid>
    </Grid>
  );
};

export default Dashboard;