
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Get posts for activity feed
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const posts = await prisma.post.findMany({
      take: Number(limit),
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            role: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    res.json(posts);
  } catch (error) {
    logger.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create new post
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, postType = 'text', attachmentUrl, visibility = 'public' } = req.body;
    const userId = req.user!.id;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const post = await prisma.post.create({
      data: {
        authorId: parseInt(userId),
        content: content.trim(),
        postType,
        attachmentUrl,
        visibility,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            role: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    logger.info(`Post created by user ${userId}`, { postId: post.id });
    res.status(201).json(post);
  } catch (error) {
    logger.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add reaction to post
router.post('/:id/reactions', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = parseInt(req.user!.id);
    const { reaction } = req.body;

    if (!['like', 'love', 'celebrate', 'support', 'insightful'].includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    // Check if user already reacted
    const existingReaction = await prisma.postReaction.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    let result;

    if (existingReaction) {
      if (existingReaction.reaction === reaction) {
        // Remove reaction if same type
        await prisma.postReaction.delete({
          where: { id: existingReaction.id },
        });
        result = { action: 'removed', reaction };
      } else {
        // Update reaction if different type
        result = await prisma.postReaction.update({
          where: { id: existingReaction.id },
          data: { reaction },
        });
        result = { action: 'updated', reaction: result.reaction };
      }
    } else {
      // Create new reaction
      await prisma.postReaction.create({
        data: { postId, userId, reaction },
      });
      result = { action: 'added', reaction };
    }

    res.json(result);
  } catch (error) {
    logger.error('Error handling reaction:', error);
    res.status(500).json({ error: 'Failed to handle reaction' });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = parseInt(req.user!.id);
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = parseInt(req.user!.id);

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
