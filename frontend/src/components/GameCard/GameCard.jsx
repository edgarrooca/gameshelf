import { Card, Image, Text, Badge, Group } from '@mantine/core';
import classes from './GameCard.module.css';

// Tarjeta de juego individual
export function GameCard({ game, onClick }) {
  const handleClick = () => {
    if (onClick) {
      onClick(game);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completado':
        return 'green';
      case 'jugando':
        return 'blue';
      case 'pendiente':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getBadgeInfo = () => {
    if (game.rating != null) {
      return { label: `⭐ ${game.rating}`, color: 'yellow' };
    } else if (game.status) {
      return { label: game.status, color: getStatusColor(game.status) };
    }
    return null;
  };

  const badgeInfo = getBadgeInfo();

  return (
    <div
      className={classes.card}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className={classes.imageWrapper}>
        <Image src={game.coverImage} alt={game.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div className={classes.overlay} />
      </div>
      <div className={classes.content}>
        <Text size="md" fw={600} className={classes.title} lineClamp={2}>{game.title}</Text>
        {badgeInfo && (
          <Group gap="xs" mt="xs">
            <Badge variant="light" color={badgeInfo.color} size="sm">{badgeInfo.label}</Badge>
          </Group>
        )}
      </div>
    </div>
  );
}
