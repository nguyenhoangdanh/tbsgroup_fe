'use server';

import {getKindeServerSession} from '@kinde-oss/kinde-auth-nextjs/server';
import {prisma} from '../lib/prismadb';

export async function fetchFormStats() {
  try {
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized to use resource',
      };
    }

    const {_sum, _count} = await prisma.form.aggregate({
      where: {userId: user.id},
      _sum: {
        views: true,
        responses: true,
      },
      _count: {
        id: true,
      },
    });

    const views = _sum.views ?? 0;
    const totalResponses = _sum.responses ?? 0;
    const totalForms = _count.id ?? 0;

    const conversionRate = views > 0 ? (totalResponses / views) * 100 : 0;
    const engagementRate = totalForms > 0 ? (views / totalForms) * 100 : 0;

    return {
      success: true,
      views,
      totalResponses,
      totalForms,
      conversionRate,
      engagementRate,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong',
    };
  }
}
