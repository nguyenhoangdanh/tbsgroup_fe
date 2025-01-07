'use server';

import {getKindeServerSession} from '@kinde-oss/kinde-auth-nextjs/server';
import {prisma} from '../lib/prismadb';
import {defaultPrimaryColor, defaultBackgroundColor} from '../constant/index';
import { FormWithSettings } from '@/@types/form.type';

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

export async function createForm(data: {name: string; description: string}) {
  try {
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized to use resource',
      };
    }

    const formSettings = await prisma.formSettings.create({
      data: {
        primaryColor: defaultPrimaryColor,
        backgroundColor: defaultBackgroundColor,
      },
    });

    const form = await prisma.form.create({
      data: {
        name: data.name,
        description: data.description,
        userId: user.id,
        creatorName: user?.given_name || '',
        settingsId: formSettings.id,
      },
    });

    if (!form) {
      return {
        success: false,
        message: 'Failed to create form, please try again',
      };
    }

    return {
      success: true,
      message: 'Form created successfully',
      form,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong',
    };
  }
}

export async function fetchAllForms() {
  try {
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized to use resource',
      };
    }

    const forms = await prisma.form.findMany({
      where: {userId: user.id},
      include: {
        settings: true,
      },
      orderBy:{
        createdAt: 'desc'
      }
    });

    return {
      success: true,
      forms,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Something went wrong',
    };
  }
}

export async function saveForm(data: {
  formId: string;
  name?: string;
  description?: string;
  jsonBlocks: string;
}) {
  try {
    const { formId, name, description, jsonBlocks } = data;
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: "Unauthorized to use this resource",
      };
    }

    if (!formId || !jsonBlocks) {
      return {
        success: false,
        message: "Invalid input data",
      };
    }

    const form = await prisma.form.update({
      where: { formId: formId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        jsonBlocks,
      },
    });

    return {
      success: true,
      message: "Form updated successfully",
      form,
    };
  } catch (error) {
    return {
      success: false,
      message: "An error occurred while updating the form",
    };
  }
}

export async function updatePublish(formId: string, published: boolean) {
  try {
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: "Unauthorized to use this resource",
      };
    }

    if (!formId) {
      return {
        success: false,
        message: "FormId is required",
      };
    }

    const form = await prisma.form.update({
      where: { formId },
      data: { published },
    });

    return {
      success: true,
      message: `Form successfully ${published ? "published" : "unpublished"}`,
      published: form.published,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update publish status",
    };
  }
}

export async function fetchPublishFormById(formId: string): Promise<{
  form?: FormWithSettings | null;
  success: boolean;
  message: string;
}> {
  try {
    if (!formId) {
      return {
        success: false,
        message: "FormId is required",
      };
    }
    const form = await prisma.form.findFirst({
      where: {
        formId: formId,
        published: true,
      },
      include: {
        settings: true,
      },
    });

    if (!form) {
      return {
        success: false,
        message: "Form not found",
      };
    }

    return {
      success: true,
      message: "Form fetched successfully",
      form,
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

export async function submitResponse(formId: string, response: string) {
  try {
    if (!formId) {
      return {
        success: false,
        message: "FormId is required",
      };
    }
    await prisma.form.update({
      where: {
        formId: formId,
        published: true,
      },
      data: {
        formResponses: {
          create: {
            jsonResponse: response,
          },
        },
        responses: {
          increment: 1,
        },
      },
    });
    return {
      success: true,
      message: "Response submitted",
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

export async function fetchAllResponseByFormId(formId: string) {
  try {
    const session = getKindeServerSession();
    const user = await session.getUser();

    if (!user) {
      return {
        success: false,
        message: "Unauthorized to use this resource",
      };
    }

    const form = await prisma.form.findUnique({
      where: {
        formId: formId,
      },
      include: {
        formResponses: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return {
      success: true,
      message: "Form fetched successfully",
      form,
    };
  } catch (error) {
    return {
      success: false,
      message: "Something went wrong",
    };
  }
}

