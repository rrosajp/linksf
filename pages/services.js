import React, { Component } from 'react'
import './root.scss'
import FilterBar from './../components/FilterBar'
import ServiceList from './../components/ServiceList'
import Rebase from 're-base'
const base = Rebase.createClass('https://vivid-inferno-4672.firebaseio.com/')


export default class extends Component {
  constructor(props) {
    super(props)
    this.state = {
      services: [],
      loading: true,
    }
  }

  componentWillMount() {
    base.bindToState('services', {
      context: this,
      state: 'services',
      asArray: true,
    })
  }

  render() {
    const { services } = this.state
    return (
      <div className="root">
          <FilterBar />
          <ServiceList services={services} />
      </div>
    )
  }
}
