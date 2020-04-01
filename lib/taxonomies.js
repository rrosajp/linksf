import icons from '../icons/css/fontello.css'
import { capitalize } from './stringHelpers'

export const getIcon = (taxonomy) => (
  icons[`icon-${taxonomy}`] + ` icon-${taxonomy}`
)

export const taxonomiesWithIcons = (taxonomies) => (
  taxonomies.map(taxonomy => (
    { id: taxonomy, name: capitalize(taxonomy).replace('-', ' '), icon: getIcon(taxonomy) }
  ))
)

export const relevantTaxonomies = (services) => {
  const servicesList = Object.values(services)
  return Array.from(new Set(servicesList.map(service => service.taxonomy)))
}
