import { dayNumber, type TimeFormatOptions } from './time';

export type Quote = {
  text: string;
  author: string;
};

// Public-domain sources only (old translations and pre-1930 texts). Keep each quote short.
export const quotes: readonly Quote[] = [
  {
    text: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'Look within. Within is the fountain of good, and it will ever bubble up, if you will ever dig.',
    author: 'Marcus Aurelius',
  },
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius' },
  {
    text: 'No longer talk at all about the kind of man that a good man ought to be, but be such.',
    author: 'Marcus Aurelius',
  },
  {
    text: 'Nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul.',
    author: 'Marcus Aurelius',
  },
  { text: 'The soul is dyed by the thoughts.', author: 'Marcus Aurelius' },
  {
    text: 'We suffer more often in imagination than in reality.',
    author: 'Seneca',
  },
  { text: 'While we are postponing, life speeds by.', author: 'Seneca' },
  {
    text: 'Begin at once to live, and count each separate day as a separate life.',
    author: 'Seneca',
  },
  {
    text: 'It is not that we have a short time to live, but that we waste much of it.',
    author: 'Seneca',
  },
  {
    text: 'Men are disturbed not by things, but by the views which they take of them.',
    author: 'Epictetus',
  },
  {
    text: 'First say to yourself what you would be; and then do what you have to do.',
    author: 'Epictetus',
  },
  {
    text: 'All that we are is the result of what we have thought.',
    author: 'The Dhammapada',
  },
  {
    text: 'Better than a thousand hollow words is one word that brings peace.',
    author: 'The Dhammapada',
  },
  {
    text: 'Hatred does not cease by hatred, but only by love; this is the eternal rule.',
    author: 'The Dhammapada',
  },
  {
    text: 'The journey of a thousand li begins with a single step.',
    author: 'Lao Tzu',
  },
  {
    text: 'To affect the quality of the day, that is the highest of arts.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'Heaven is under our feet as well as over our heads.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'Morning is when I am awake and there is a dawn in me.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'Our life is frittered away by detail. Simplify, simplify.',
    author: 'Henry David Thoreau',
  },
  {
    text: 'Live in each season as it passes; breathe the air, drink the drink, taste the fruit.',
    author: 'Henry David Thoreau',
  },
  { text: 'Time is but the stream I go a-fishing in.', author: 'Henry David Thoreau' },
  { text: 'Nothing can bring you peace but yourself.', author: 'Ralph Waldo Emerson' },
  {
    text: 'Write it on your heart that every day is the best day in the year.',
    author: 'Ralph Waldo Emerson',
  },
  {
    text: 'Finish each day and be done with it. You have done what you could.',
    author: 'Ralph Waldo Emerson',
  },
  { text: 'The years teach much which the days never know.', author: 'Ralph Waldo Emerson' },
  {
    text: 'To every thing there is a season, and a time to every purpose under the heaven.',
    author: 'Ecclesiastes',
  },
  { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
];

/** One quote per calendar day in the given time zone. */
export const quoteForDay = (d: Date, options: TimeFormatOptions = {}): Quote =>
  quotes[dayNumber(d, options) % quotes.length];
