// Seed-bound compatibility helpers for scripts and unit tests. Browser code uses services/itinerary.js.
import { spots } from '../data.js'
import { recommendedRoutes } from '../data/routes.js'
import { createItineraryTools } from './itineraryCore.js'
export { validTravelDate, copyText, downloadText } from './itineraryCore.js'
export const { validateSavedRoute, itineraryText, sharePath } = createItineraryTools({
  spots,
  recommendedRoutes,
})
