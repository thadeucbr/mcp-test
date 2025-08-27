import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { MongoClient, ObjectId } from 'mongodb';

// Interfaces para as operações
interface RegisterMealInput {
  operation: 'create' | 'read' | 'update' | 'delete' | 'daily_summary';
  userId?: string;
  mealId?: string;
  mealData?: {
    mealType: string;
    description: string;
    calories: number;
    carbs?: number;
    protein?: number;
    fat?: number;
    date?: string;
  };
}

interface MealDocument {
  _id?: ObjectId;
  userId: string;
  mealType: string;
  description: string;
  calories: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tool: RegisterMealTool
// Description: Esta ferramenta permite operações CRUD completas para gerenciamento de refeições e calorias dos usuários.
class RegisterMealTool extends MCPTool<RegisterMealInput> {
  name = 'register_meal';
  description = `Complete meal and nutrition management system with full CRUD operations.

  CAPABILITIES:
  • Register meals with detailed nutritional information
  • Track daily calorie and macronutrient consumption
  • Query historical meal data
  • Edit meal records when nutritional info changes
  • Delete incorrect meal entries
  • Generate daily nutritional summaries

  USE CASES:
  • Personal nutrition tracking and monitoring
  • Meal logging for diet planning
  • Calorie counting and macro tracking
  • Food diary management
  • Nutritional analysis and reporting

  FEATURES:
  • Supports multiple meals per day (breakfast, lunch, dinner, snacks)
  • Tracks calories, carbohydrates, protein, and fat
  • Automatic daily totals calculation
  • Flexible meal categorization
  • Date/time tracking for meal timing
  • User-specific data isolation

  DATA STRUCTURE:
  Each meal record contains: meal type, description, nutritional values,
  consumption date/time, and user association. All operations are user-scoped
  for privacy and data organization.`;

  schema = {
    operation: {
      type: z.enum(['create', 'read', 'update', 'delete', 'daily_summary']),
      description: `Operation type to perform:

      • create: Register a new meal with nutritional data
      • read: Get all meals consumed today by a user
      • update: Modify an existing meal record
      • delete: Remove a meal from the database
      • daily_summary: Calculate total calories and macronutrients for the day

      Each operation requires different parameters - see other fields for details.`,
    },
    userId: {
      type: z.string().optional(),
      description: `User identifier for the operation.

      Required for: create, read, daily_summary
      Should match the user ID from your user management system.
      Example: "user123", "thadeu@example.com", or database ObjectId string`,
    },
    mealId: {
      type: z.string().optional(),
      description: `Unique identifier of the meal to update or delete.

      Required for: update, delete
      This is the _id returned when creating a meal.
      Example: "507f1f77bcf86cd799439011"`,
    },
    mealData: {
      type: z.object({
        mealType: z.string().describe(`Meal category/type. Common values:
        • breakfast - Café da manhã
        • lunch - Almoço
        • dinner - Jantar
        • snack - Lanche
        • morning_snack - Lanche da manhã
        • afternoon_snack - Lanche da tarde
        • supper - Ceia`),
        description: z.string().describe(`Detailed description of what was consumed.
        Be specific to help with nutritional analysis.
        Examples: "2 ovos mexidos com espinafre", "Arroz branco 100g, feijão 50g, frango grelhado 150g"`),
        calories: z.number().describe(`Total calories consumed in this meal.
        Must be a positive number.
        Example: 350 (for a typical breakfast)`),
        carbs: z.number().optional().describe(`Carbohydrates in grams.
        Optional but recommended for complete nutritional tracking.
        Example: 45.5 (grams of carbs)`),
        protein: z.number().optional().describe(`Protein in grams.
        Optional but recommended for complete nutritional tracking.
        Example: 25.0 (grams of protein)`),
        fat: z.number().optional().describe(`Fat in grams.
        Optional but recommended for complete nutritional tracking.
        Example: 12.5 (grams of fat)`),
        date: z.string().optional().describe(`Date when the meal was consumed.
        Format: ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ)
        If not provided, defaults to current date/time.
        Example: "2025-08-27T08:30:00.000Z"`),
      }).optional(),
      description: `Nutritional data for the meal. Required for create and update operations.

      Include as much detail as possible for better nutritional tracking.
      Macronutrients (carbs, protein, fat) are optional but highly recommended.`,
    },
  };

  private async getMongoClient() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    return client;
  }

  async execute(input: RegisterMealInput) {
    console.log('[DEBUG] RegisterMealTool.execute chamado com input:', input);

    const client = await this.getMongoClient();

    try {
      const db = client.db('nutripocket');
      const collection = db.collection<MealDocument>('user_meals');

      const { operation, userId, mealId, mealData } = input;

      switch (operation) {
        case 'create':
          return await this.createMeal(collection, userId!, mealData!);

        case 'read':
          return await this.readMeals(collection, userId!);

        case 'update':
          return await this.updateMeal(collection, mealId!, mealData!);

        case 'delete':
          return await this.deleteMeal(collection, mealId!);

        case 'daily_summary':
          return await this.getDailySummary(collection, userId!);

        default:
          return {
            success: false,
            data: 'Operação não suportada',
          };
      }
    } finally {
      await client.close();
    }
  }

  /**
   * Register a new meal in the database
   * Creates a meal document with nutritional information
   */
  private async createMeal(collection: any, userId: string, mealData: any) {
    const meal: MealDocument = {
      userId,
      mealType: mealData.mealType,
      description: mealData.description,
      calories: mealData.calories,
      carbs: mealData.carbs || 0,
      protein: mealData.protein || 0,
      fat: mealData.fat || 0,
      date: mealData.date ? new Date(mealData.date) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(meal);

    return {
      success: true,
      data: {
        message: 'Refeição registrada com sucesso',
        mealId: result.insertedId.toString(),
        meal: {
          ...meal,
          _id: result.insertedId,
        },
      },
    };
  }

  /**
   * Query all meals for a user on the current day
   * Returns meals sorted by date/time
   */
  private async readMeals(collection: any, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await collection
      .find({
        userId,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .sort({ date: 1 })
      .toArray();

    return {
      success: true,
      data: {
        meals: meals.map((meal: MealDocument) => ({
          id: meal._id?.toString(),
          mealType: meal.mealType,
          description: meal.description,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
          date: meal.date,
        })),
        totalMeals: meals.length,
      },
    };
  }

  /**
   * Update an existing meal record
   * Only updates provided fields, preserves others
   */
  private async updateMeal(collection: any, mealId: string, mealData: any) {
    const updateData: Partial<MealDocument> = {
      updatedAt: new Date(),
    };

    if (mealData.mealType) updateData.mealType = mealData.mealType;
    if (mealData.description) updateData.description = mealData.description;
    if (mealData.calories !== undefined) updateData.calories = mealData.calories;
    if (mealData.carbs !== undefined) updateData.carbs = mealData.carbs;
    if (mealData.protein !== undefined) updateData.protein = mealData.protein;
    if (mealData.fat !== undefined) updateData.fat = mealData.fat;

    const result = await collection.updateOne(
      { _id: new ObjectId(mealId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error('Refeição não encontrada');
    }

    return {
      success: true,
      data: {
        message: 'Refeição atualizada com sucesso',
        modifiedCount: result.modifiedCount,
      },
    };
  }

  /**
   * Delete a meal record from the database
   * Permanently removes the meal document
   */
  private async deleteMeal(collection: any, mealId: string) {
    const result = await collection.deleteOne({ _id: new ObjectId(mealId) });

    if (result.deletedCount === 0) {
      throw new Error('Refeição não encontrada');
    }

    return {
      success: true,
      data: {
        message: 'Refeição excluída com sucesso',
        deletedCount: result.deletedCount,
      },
    };
  }

  /**
   * Get nutritional summary for the current day
   * Aggregates all meals to show total calories and macronutrients
   */
  private async getDailySummary(collection: any, userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await collection
      .find({
        userId,
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      })
      .toArray();

    const summary = meals.reduce(
      (acc: any, meal: MealDocument) => ({
        totalCalories: acc.totalCalories + (meal.calories || 0),
        totalCarbs: acc.totalCarbs + (meal.carbs || 0),
        totalProtein: acc.totalProtein + (meal.protein || 0),
        totalFat: acc.totalFat + (meal.fat || 0),
        mealCount: acc.mealCount + 1,
      }),
      {
        totalCalories: 0,
        totalCarbs: 0,
        totalProtein: 0,
        totalFat: 0,
        mealCount: 0,
      }
    );

    return {
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        summary,
        meals: meals.map((meal: MealDocument) => ({
          id: meal._id?.toString(),
          mealType: meal.mealType,
          description: meal.description,
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fat: meal.fat,
        })),
      },
    };
  }
}

export default RegisterMealTool;