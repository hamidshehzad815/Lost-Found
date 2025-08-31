


import { Category, Tag, User, sequelize } from "../models/Index.js";


const defaultCategories = [
  {
    name: "Electronics",
    description:
      "Phones, laptops, tablets, headphones, chargers, and other electronic devices",
  },
  {
    name: "Clothing",
    description:
      "Shirts, pants, jackets, shoes, accessories, and all types of clothing items",
  },
  {
    name: "Bags & Backpacks",
    description: "Handbags, backpacks, luggage, wallets, and carrying cases",
  },
  {
    name: "Books & Documents",
    description:
      "Textbooks, notebooks, important documents, and reading materials",
  },
  {
    name: "Keys & Cards",
    description:
      "House keys, car keys, ID cards, credit cards, and access cards",
  },
  {
    name: "Jewelry & Accessories",
    description:
      "Rings, necklaces, watches, bracelets, and personal accessories",
  },
  {
    name: "Sports Equipment",
    description: "Balls, equipment, gear, and sporting accessories",
  },
  {
    name: "Personal Items",
    description:
      "Glasses, umbrellas, water bottles, and other personal belongings",
  },
  {
    name: "Vehicles",
    description: "Cars, bikes, motorcycles, and vehicle-related items",
  },
  {
    name: "Other",
    description: "Items that don't fit into other categories",
  },
];


const defaultTags = [
  
  { name: "campus", description: "Found on campus grounds" },
  { name: "library", description: "Found in library" },
  { name: "cafeteria", description: "Found in dining area" },
  { name: "parking", description: "Found in parking area" },
  { name: "classroom", description: "Found in classroom" },
  { name: "hostel", description: "Found in hostel/dormitory" },
  { name: "gym", description: "Found in gymnasium" },
  { name: "outdoor", description: "Found outdoors" },

  
  { name: "damaged", description: "Item has visible damage" },
  { name: "excellent", description: "Item in excellent condition" },
  { name: "working", description: "Item is functioning properly" },
  { name: "broken", description: "Item is not working" },

  
  { name: "urgent", description: "Owner needs item urgently" },
  { name: "important", description: "Important item for owner" },
  { name: "valuable", description: "High-value item" },

  
  { name: "black", description: "Black colored item" },
  { name: "white", description: "White colored item" },
  { name: "blue", description: "Blue colored item" },
  { name: "red", description: "Red colored item" },
  { name: "green", description: "Green colored item" },
  { name: "yellow", description: "Yellow colored item" },
  { name: "pink", description: "Pink colored item" },
  { name: "purple", description: "Purple colored item" },
  { name: "brown", description: "Brown colored item" },
  { name: "gray", description: "Gray colored item" },

  
  { name: "apple", description: "Apple brand item" },
  { name: "samsung", description: "Samsung brand item" },
  { name: "nike", description: "Nike brand item" },
  { name: "adidas", description: "Adidas brand item" },
  { name: "sony", description: "Sony brand item" },

  
  { name: "small", description: "Small-sized item" },
  { name: "medium", description: "Medium-sized item" },
  { name: "large", description: "Large-sized item" },

  
  { name: "waterproof", description: "Water-resistant item" },
  { name: "vintage", description: "Vintage or old item" },
  { name: "new", description: "Recently purchased item" },
  { name: "handmade", description: "Handcrafted item" },
  {
    name: "personalized",
    description: "Item with personal engravings/markings",
  },
];


const defaultAdminUser = {
  name: "System Administrator",
  email: "admin@lostfound.app",
  password_hash: "$2b$10$defaulthashfordemopurposes", 
  is_verified: true,
  is_active: true,
  provider: "local",
  phone: "+1234567890",
};

const seedDefaultData = async () => {
  try {
    console.log("🌱 Starting default data seeding...");

    
    const transaction = await sequelize.transaction();

    try {
      
      console.log("📂 Seeding categories...");
      for (const categoryData of defaultCategories) {
        const [category, created] = await Category.findOrCreate({
          where: { name: categoryData.name },
          defaults: categoryData,
          transaction,
        });
        if (created) {
          console.log(`  ✅ Created category: ${category.name}`);
        } else {
          console.log(`  ⏭️  Category already exists: ${category.name}`);
        }
      }

      
      console.log("🏷️  Seeding tags...");
      for (const tagData of defaultTags) {
        const [tag, created] = await Tag.findOrCreate({
          where: { name: tagData.name },
          defaults: tagData,
          transaction,
        });
        if (created) {
          console.log(`  ✅ Created tag: ${tag.name}`);
        } else {
          console.log(`  ⏭️  Tag already exists: ${tag.name}`);
        }
      }

      
      console.log("👤 Checking for admin user...");
      const existingAdmin = await User.findOne({
        where: { email: defaultAdminUser.email },
        transaction,
      });

      if (!existingAdmin) {
        const adminUser = await User.create(defaultAdminUser, { transaction });
        console.log(`  ✅ Created admin user: ${adminUser.email}`);
      } else {
        console.log(`  ⏭️  Admin user already exists: ${existingAdmin.email}`);
      }

      
      await transaction.commit();

      console.log("🎉 Default data seeding completed successfully!");

      
      const categoriesCount = await Category.count();
      const tagsCount = await Tag.count();
      const usersCount = await User.count();

      return {
        success: true,
        summary: {
          categories: categoriesCount,
          tags: tagsCount,
          users: usersCount,
        },
        message: "Default data seeded successfully",
      };
    } catch (error) {
      
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("❌ Error seeding default data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};


const needsSeeding = async () => {
  try {
    const categoriesCount = await Category.count();
    const tagsCount = await Tag.count();

    
    return categoriesCount === 0 || tagsCount === 0;
  } catch (error) {
    console.log(
      "⚠️  Error checking seeding status, will attempt seeding:",
      error.message
    );
    return true;
  }
};


const autoSeedIfNeeded = async () => {
  try {
    const shouldSeed = await needsSeeding();

    if (shouldSeed) {
      console.log(
        "🌱 Database appears to need default data, starting seeding..."
      );
      return await seedDefaultData();
    } else {
      console.log("✅ Default data already exists, skipping seeding.");
      return {
        success: true,
        message: "Seeding not needed, data already exists",
      };
    }
  } catch (error) {
    console.error("❌ Error in auto-seeding:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export { seedDefaultData, autoSeedIfNeeded, needsSeeding };
export default autoSeedIfNeeded;
