import { spots, recommendedRoutes } from './catalog.js'
import { createItineraryTools } from '../utils/itineraryCore.js'
export { validTravelDate, copyText, downloadText } from '../utils/itineraryCore.js'
export const { validateSavedRoute, itineraryText, sharePath } = createItineraryTools({
  spots,
  recommendedRoutes,
})
