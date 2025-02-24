import { Theme } from './types';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { borderRadius } from './borderRadius';

export const layout = (theme: Theme) => ({
  card: {
    backgroundColor: theme.card.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows(theme).medium,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  smallCard: {
    backgroundColor: theme.card.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows(theme).small,
    borderWidth: 1,
    borderColor: theme.card.border,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}); 