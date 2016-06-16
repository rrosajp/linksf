import React, { PropTypes } from 'react'
import './ServiceList.scss'
import ServiceRow from '../ServiceRow'

const ServiceList = (props) => (
  <div className="column">
    {props.services.map(service => <ServiceRow {...service} />)}
  </div>
)

export default ServiceList
