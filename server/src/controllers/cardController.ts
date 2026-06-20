import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSocketInstance } from '../lib/socket';

export const getCards = async (req: AuthRequest, res: Response) => {
  try {
    const cards = await prisma.card.findMany({
      where: { userId: req.userId },
      orderBy: { position: 'asc' },
    });

    return res.status(200).json(cards);
  } catch (error) {
    console.error('Get cards error:', error);
    return res.status(500).json({ error: 'Something went wrong fetching cards' });
  }
};

export const createCard = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, status, position } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const card = await prisma.card.create({
      data: {
        title,
        description: description || null,
        status: status || 'todo',
        position: position ?? 0,
        userId: req.userId as string,
      },
    });

    getSocketInstance().to(req.userId as string).emit('CARD_CREATED', card);

    return res.status(201).json(card);
  } catch (error) {
    console.error('Create card error:', error);
    return res.status(500).json({ error: 'Something went wrong creating the card' });
  }
};

export const updateCard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { title, description, status, position } = req.body;

    const existingCard = await prisma.card.findUnique({ where: { id } });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (existingCard.userId !== req.userId) {
      return res.status(403).json({ error: 'You do not have permission to edit this card' });
    }

    const isMove = (status !== undefined || position !== undefined) && title === undefined && description === undefined;

    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(position !== undefined && { position }),
      },
    });

    getSocketInstance()
      .to(req.userId as string)
      .emit(isMove ? 'CARD_MOVED' : 'CARD_UPDATED', updatedCard);

    return res.status(200).json(updatedCard);
  } catch (error) {
    console.error('Update card error:', error);
    return res.status(500).json({ error: 'Something went wrong updating the card' });
  }
};

export const deleteCard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const existingCard = await prisma.card.findUnique({ where: { id } });

    if (!existingCard) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (existingCard.userId !== req.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this card' });
    }

    await prisma.card.delete({ where: { id } });

    getSocketInstance().to(req.userId as string).emit('CARD_DELETED', { id });

    return res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Delete card error:', error);
    return res.status(500).json({ error: 'Something went wrong deleting the card' });
  }
};