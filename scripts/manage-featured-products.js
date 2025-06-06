const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class FeaturedProductsManager {
  /**
   * Get all featured products
   */
  async getFeaturedProducts() {
    try {
      const products = await prisma.product.findMany({
        where: { featured: true },
        include: {
          category: true,
          brand: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Found ${products.length} featured products:`);
      products.forEach(product => {
        console.log(`- ${product.name} (${product.category?.name || 'No category'}) - $${product.price}`);
      });
      
      return products;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw error;
    }
  }

  /**
   * Add product to featured list
   */
  async addToFeatured(productId) {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { featured: true },
        include: {
          category: true,
          brand: true
        }
      });
      
      console.log(`✅ Added "${product.name}" to featured products`);
      return product;
    } catch (error) {
      console.error('Error adding product to featured:', error);
      throw error;
    }
  }

  /**
   * Remove product from featured list
   */
  async removeFromFeatured(productId) {
    try {
      const product = await prisma.product.update({
        where: { id: productId },
        data: { featured: false },
        include: {
          category: true,
          brand: true
        }
      });
      
      console.log(`❌ Removed "${product.name}" from featured products`);
      return product;
    } catch (error) {
      console.error('Error removing product from featured:', error);
      throw error;
    }
  }

  /**
   * Toggle featured status
   */
  async toggleFeatured(productId) {
    try {
      const currentProduct = await prisma.product.findUnique({
        where: { id: productId }
      });
      
      if (!currentProduct) {
        throw new Error('Product not found');
      }
      
      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { featured: !currentProduct.featured },
        include: {
          category: true,
          brand: true
        }
      });
      
      const status = updatedProduct.featured ? 'added to' : 'removed from';
      console.log(`🔄 "${updatedProduct.name}" ${status} featured products`);
      
      return updatedProduct;
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw error;
    }
  }

  /**
   * Set featured products limit and manage overflow
   */
  async manageFeaturedLimit(maxFeatured = 6) {
    try {
      const featuredProducts = await prisma.product.findMany({
        where: { featured: true },
        orderBy: { createdAt: 'asc' } // Oldest first
      });
      
      if (featuredProducts.length <= maxFeatured) {
        console.log(`✅ Featured products (${featuredProducts.length}) within limit (${maxFeatured})`);
        return;
      }
      
      const overflow = featuredProducts.length - maxFeatured;
      const productsToUnfeature = featuredProducts.slice(0, overflow);
      
      console.log(`⚠️ Too many featured products (${featuredProducts.length}). Removing ${overflow} oldest ones...`);
      
      for (const product of productsToUnfeature) {
        await this.removeFromFeatured(product.id);
      }
      
      console.log(`✅ Featured products limit managed. Now showing ${maxFeatured} products.`);
    } catch (error) {
      console.error('Error managing featured limit:', error);
      throw error;
    }
  }

  /**
   * Find products by name or category for featuring
   */
  async findProductsToFeature(searchTerm) {
    try {
      const products = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { category: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { brand: { name: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        },
        include: {
          category: true,
          brand: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log(`Found ${products.length} products matching "${searchTerm}":`);
      products.forEach(product => {
        const featuredStatus = product.featured ? '⭐ FEATURED' : '○ Not featured';
        console.log(`- ${product.name} (${product.category?.name || 'No category'}) - ${featuredStatus} - ID: ${product.id}`);
      });
      
      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get featured products statistics
   */
  async getFeaturedStats() {
    try {
      const totalProducts = await prisma.product.count();
      const featuredProducts = await prisma.product.count({
        where: { featured: true }
      });
      
      const categoryStats = await prisma.product.groupBy({
        by: ['categoryId'],
        where: { featured: true },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } }
      });
      
      console.log('\n📊 Featured Products Statistics:');
      console.log(`Total Products: ${totalProducts}`);
      console.log(`Featured Products: ${featuredProducts}`);
      console.log(`Featured Percentage: ${((featuredProducts / totalProducts) * 100).toFixed(1)}%`);
      
      if (categoryStats.length > 0) {
        console.log('\nFeatured by Category:');
        for (const stat of categoryStats) {
          if (stat.categoryId) {
            const category = await prisma.category.findUnique({
              where: { id: stat.categoryId }
            });
            console.log(`- ${category?.name || 'Unknown'}: ${stat._count.categoryId} products`);
          }
        }
      }
      
      return {
        totalProducts,
        featuredProducts,
        featuredPercentage: (featuredProducts / totalProducts) * 100,
        categoryStats
      };
    } catch (error) {
      console.error('Error getting featured stats:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const manager = new FeaturedProductsManager();
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'list':
        await manager.getFeaturedProducts();
        break;
        
      case 'add':
        if (!arg) {
          console.error('Please provide a product ID to add to featured');
          process.exit(1);
        }
        await manager.addToFeatured(arg);
        break;
        
      case 'remove':
        if (!arg) {
          console.error('Please provide a product ID to remove from featured');
          process.exit(1);
        }
        await manager.removeFromFeatured(arg);
        break;
        
      case 'toggle':
        if (!arg) {
          console.error('Please provide a product ID to toggle featured status');
          process.exit(1);
        }
        await manager.toggleFeatured(arg);
        break;
        
      case 'limit':
        const maxFeatured = arg ? parseInt(arg) : 6;
        await manager.manageFeaturedLimit(maxFeatured);
        break;
        
      case 'search':
        if (!arg) {
          console.error('Please provide a search term');
          process.exit(1);
        }
        await manager.findProductsToFeature(arg);
        break;
        
      case 'stats':
        await manager.getFeaturedStats();
        break;
        
      default:
        console.log(`
🛍️  Featured Products Manager

Usage: node manage-featured-products.js <command> [arguments]

Commands:
  list                    - List all featured products
  add <productId>         - Add product to featured list
  remove <productId>      - Remove product from featured list
  toggle <productId>      - Toggle featured status for product
  limit [maxNumber]       - Manage featured products limit (default: 6)
  search <term>           - Search products by name, category, or brand
  stats                   - Show featured products statistics

Examples:
  node manage-featured-products.js list
  node manage-featured-products.js add 507f1f77bcf86cd799439011
  node manage-featured-products.js search "iPhone"
  node manage-featured-products.js limit 8
  node manage-featured-products.js stats
        `);
    }
  } catch (error) {
    console.error('Command failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = FeaturedProductsManager;