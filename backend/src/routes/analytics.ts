import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { keycloakAuth } from '../middleware/keycloak';

const router = Router();
const prisma = new PrismaClient();

// Get analytics data based on user role
router.get('/', keycloakAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const schoolId = (req as any).user?.schoolId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let analyticsData: any = {};

    switch (userRole) {
      case 'platform_admin':
        analyticsData = await getPlatformAnalytics();
        break;
      case 'school_admin':
        analyticsData = await getSchoolAnalytics(schoolId);
        break;
      case 'teacher':
        analyticsData = await getTeacherAnalytics(userId, schoolId);
        break;
      default:
        analyticsData = await getBasicAnalytics(userId);
    }

    res.json(analyticsData);
  } catch (error) {
    logger.error('Analytics fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Platform admin analytics
async function getPlatformAnalytics() {
  try {
    const totalUsers = await prisma.user.count();
    const totalSchools = await prisma.school.count();
    
    // Get users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Calculate growth rate
    const growthRate = totalUsers > 0 ? ((recentUsers / totalUsers) * 100) : 0;

    // Get active users (users who logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Get user growth data for charts
    const userGrowthData = await getUserGrowthData();
    const recentActivity = await getRecentActivityData();

    return {
      totalUsers,
      totalSchools,
      activeUsers,
      growthRate: Math.round(growthRate * 100) / 100,
      userGrowthData,
      recentActivity
    };
  } catch (error) {
    logger.error('Platform analytics error:', error);
    throw error;
  }
}

// School admin analytics
async function getSchoolAnalytics(schoolId: number) {
  if (!schoolId) {
    throw new Error('School ID required for school analytics');
  }

  try {
    const schoolUsers = await prisma.user.count({
      where: { schoolId }
    });

    const activeSchoolUsers = await prisma.user.count({
      where: {
        schoolId,
        lastLoginAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const recentSchoolUsers = await prisma.user.count({
      where: {
        schoolId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    const growthRate = schoolUsers > 0 ? ((recentSchoolUsers / schoolUsers) * 100) : 0;

    return {
      totalUsers: schoolUsers,
      activeUsers: activeSchoolUsers,
      growthRate: Math.round(growthRate * 100) / 100,
      schoolSpecific: true
    };
  } catch (error) {
    logger.error('School analytics error:', error);
    throw error;
  }
}

// Teacher analytics
async function getTeacherAnalytics(userId: number, schoolId: number) {
  try {
    // Basic analytics for teachers
    const classStudents = await prisma.user.count({
      where: {
        schoolId,
        role: 'student'
      }
    });

    return {
      totalStudents: classStudents,
      activeStudents: Math.floor(classStudents * 0.7), // Estimated
      teacherSpecific: true
    };
  } catch (error) {
    logger.error('Teacher analytics error:', error);
    throw error;
  }
}

// Basic analytics for regular users
async function getBasicAnalytics(userId: number) {
  try {
    return {
      personalStats: true,
      message: 'Personal analytics coming soon'
    };
  } catch (error) {
    logger.error('Basic analytics error:', error);
    throw error;
  }
}

// Helper functions for chart data
async function getUserGrowthData() {
  try {
    // Get monthly user registration data for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    users.forEach(user => {
      const month = months[user.createdAt.getMonth()];
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      users: count
    }));
  } catch (error) {
    logger.error('User growth data error:', error);
    return [];
  }
}

async function getRecentActivityData() {
  try {
    // Get daily login activity for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await prisma.user.findMany({
      where: {
        lastLoginAt: {
          gte: sevenDaysAgo
        }
      },
      select: {
        lastLoginAt: true
      }
    });

    // Group by day
    const dailyData: { [key: string]: number } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    activities.forEach(activity => {
      if (activity.lastLoginAt) {
        const day = days[activity.lastLoginAt.getDay()];
        dailyData[day] = (dailyData[day] || 0) + 1;
      }
    });

    return Object.entries(dailyData).map(([day, logins]) => ({
      day,
      logins,
      posts: Math.floor(logins * 0.3) // Estimated posts
    }));
  } catch (error) {
    logger.error('Recent activity data error:', error);
    return [];
  }
}

export default router;