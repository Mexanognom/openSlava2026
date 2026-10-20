import { useState } from 'react';
import type { Flight } from '../../types';
import { Bot, Sparkles, Plane, Clock, DollarSign } from 'lucide-react';
import { Button } from '../common';
import { formatCurrency, calculateDuration } from '../../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingAgentProps {
  flights: Flight[];
  onBook: (flight: Flight) => void;
}

interface ScoredFlight {
  flight: Flight;
  score: number;
  reason: string;
}

/**
 * Parse the query into intent signals:
 * - destination keywords (any word that isn't a common stop word)
 * - "cheapest" / "cheap" / "budget" → prefer low price
 * - "fastest" / "fast" / "quick" / "shortest" → prefer short duration
 */
function parseQuery(query: string): {
  destinations: string[];
  preferCheap: boolean;
  preferFast: boolean;
} {
  const lower = query.toLowerCase();
  const stopWords = new Set([
    'a', 'an', 'the', 'to', 'from', 'fly', 'flight', 'flights', 'book',
    'find', 'me', 'want', 'need', 'show', 'get', 'going', 'go', 'i', 'for',
    'please', 'any', 'available', 'next', 'on', 'and', 'or', 'with', 'is',
    'are', 'at', 'in', 'of', 'that', 'this', 'it', 'can', 'what',
  ]);

  const preferCheap = /cheap(est)?|budget|low.?cost|affordable|inexpensive/i.test(lower);
  const preferFast = /fast(est)?|quick(est)?|short(est)?|direct/i.test(lower);

  const destinations = lower
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return { destinations, preferCheap, preferFast };
}

function durationMinutes(flight: Flight): number {
  const dep = new Date(flight.departure_time).getTime();
  const arr = new Date(flight.arrival_time).getTime();
  return (arr - dep) / 60000;
}

/**
 * Score each flight based on parsed intent.
 * Higher score = better match.
 */
function rankFlights(flights: Flight[], query: string): ScoredFlight[] {
  const { destinations, preferCheap, preferFast } = parseQuery(query);

  const maxPrice = Math.max(...flights.map((f) => f.price), 1);
  const maxDuration = Math.max(...flights.map(durationMinutes), 1);

  return flights
    .filter((f) => f.seats_available > 0)
    .map((flight): ScoredFlight => {
      let score = 0;
      const reasons: string[] = [];

      // Destination keyword match (worth the most)
      const routeText = `${flight.origin} ${flight.destination}`.toLowerCase();
      const matchCount = destinations.filter((kw) => routeText.includes(kw)).length;
      if (matchCount > 0) {
        score += matchCount * 40;
      }

      // Price preference
      if (preferCheap) {
        const priceScore = ((maxPrice - flight.price) / maxPrice) * 30;
        score += priceScore;
        reasons.push('budget-friendly');
      }

      // Duration preference
      if (preferFast) {
        const dur = durationMinutes(flight);
        const durScore = ((maxDuration - dur) / maxDuration) * 30;
        score += durScore;
        reasons.push('shorter flight');
      }

      // Slight baseline score so non-matching flights still surface if nothing matches
      score += (flight.seats_available / 10) * 5;

      const reason =
        matchCount > 0
          ? `Matches "${flight.destination}"${reasons.length ? ` · ${reasons.join(', ')}` : ''}`
          : reasons.length
          ? reasons.join(', ')
          : 'Available route';

      return { flight, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export const BookingAgent = ({ flights, onBook }: BookingAgentProps) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [results, setResults] = useState<ScoredFlight[] | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  const handleAsk = () => {
    if (!query.trim()) return;
    setIsThinking(true);
    setResults(null);

    setTimeout(() => {
      const ranked = rankFlights(flights, query);
      setLastQuery(query);
      setResults(ranked);
      setIsThinking(false);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 border border-cosmic-purple/30"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-cosmic-gradient">
          <Bot className="text-white" size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-star-white">Booking Agent</h2>
          <p className="text-xs text-star-white/60">
            Describe where you want to go — I'll find the best routes for you
          </p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder='e.g. "cheapest flight to Mars" or "fastest route to Europa"'
          className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-star-white placeholder-star-white/40 focus:outline-none focus:ring-2 focus:ring-cosmic-purple text-sm"
        />
        <Button
          onClick={handleAsk}
          isLoading={isThinking}
          disabled={!query.trim() || isThinking}
          size="md"
        >
          <Sparkles size={16} />
          Ask Agent
        </Button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results !== null && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            <p className="text-xs text-star-white/50 mb-3">
              Top {results.length} recommendation{results.length !== 1 ? 's' : ''} for "
              <span className="text-star-white/80">{lastQuery}</span>"
            </p>

            {results.length === 0 ? (
              <p className="text-star-white/60 text-sm text-center py-4">
                No available flights matched your query. Try different keywords.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {results.map(({ flight, reason }, idx) => (
                  <motion.div
                    key={flight.flight_id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col gap-3 hover:border-cosmic-purple/50 transition-colors"
                  >
                    {/* Route */}
                    <div className="flex items-center gap-2">
                      <Plane size={14} className="text-cosmic-purple shrink-0" />
                      <span className="text-sm font-semibold text-star-white truncate">
                        {flight.origin} → {flight.destination}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-star-white/70">
                        <DollarSign size={12} className="text-alien-green" />
                        <span className="text-sm font-bold text-star-white">
                          {formatCurrency(flight.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-star-white/60">
                        <Clock size={12} />
                        <span className="text-xs">
                          {calculateDuration(flight.departure_time, flight.arrival_time)}
                        </span>
                      </div>
                    </div>

                    {/* Reason badge */}
                    <p className="text-xs text-cosmic-purple/90 bg-cosmic-purple/10 rounded px-2 py-0.5 truncate">
                      {reason}
                    </p>

                    {/* Book button */}
                    <Button
                      size="sm"
                      onClick={() => onBook(flight)}
                      className="w-full mt-auto"
                    >
                      Book
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Made with Bob
