import React from "react";
import PropTypes from "prop-types";
import gql from "graphql-tag";

import ButtonSet from "/components/ButtonSet";
import Content from "/components/Content";
import Grid from "@material-ui/core/Grid";
import LiveButton from "/components/partials/LiveButton";
import Loader from "/components/util/Loader";
import RelatedEntitiesCard from "/components/partials/RelatedEntitiesCard";

import CheckResult from "./EventDetailsCheckResult";
import DeleteAction from "./EventDetailsDeleteAction";
import ResolveAction from "./EventDetailsResolveAction";
import ReRunAction from "./EventDetailsReRunAction";
import Summary from "./EventDetailsSummary";

class EventDetailsContainer extends React.PureComponent {
  static propTypes = {
    client: PropTypes.object.isRequired,
    event: PropTypes.object,
    loading: PropTypes.bool.isRequired,
    poller: PropTypes.shape({
      running: PropTypes.bool,
      start: PropTypes.func,
      stop: PropTypes.func,
    }).isRequired,
  };

  static defaultProps = {
    event: null,
  };

  static fragments = {
    event: gql`
      fragment EventDetailsContainer_event on Event {
        id
        timestamp
        deleted @client
        ...EventDetailsDeleteAction_event
        ...EventDetailsResolveAction_event
        ...EventDetailsReRunAction_event

        check {
          ...EventDetailsCheckResult_check
          ...EventDetailsSummary_check
        }
        entity {
          ...EventDetailsCheckResult_entity
          ...RelatedEntitiesCard_entity
          ...EventDetailsSummary_entity
        }
      }

      ${CheckResult.fragments.check}
      ${CheckResult.fragments.entity}
      ${RelatedEntitiesCard.fragments.entity}
      ${Summary.fragments.check}
      ${Summary.fragments.entity}
      ${DeleteAction.fragments.event}
      ${ResolveAction.fragments.event}
      ${ReRunAction.fragments.event}
    `,
  };

  state = {
    pendingRequests: 0,
  };

  handleRequestStart = () => {
    this.setState(({ pendingRequests }) => ({
      pendingRequests: pendingRequests + 1,
    }));
  };

  handleRequestEnd = () => {
    this.setState(({ pendingRequests }) => ({
      pendingRequests: pendingRequests - 1,
    }));
  };

  render() {
    const { client, event, loading, poller } = this.props;
    const { pendingRequests } = this.state;
    const hasPendingRequests = pendingRequests > 0;

    return (
      <Loader loading={loading || hasPendingRequests} passthrough>
        {event && (
          <React.Fragment>
            <Content bottomMargin>
              <div style={{ flexGrow: 1 }} />
              <ButtonSet>
                <LiveButton
                  active={poller.running}
                  onClick={() =>
                    poller.running ? poller.stop() : poller.start()
                  }
                />
                <ResolveAction client={client} event={event} />
                <ReRunAction client={client} event={event} />
                <DeleteAction
                  client={client}
                  event={event}
                  onRequestStart={this.handleRequestStart}
                  onRequestEnd={this.handleRequestEnd}
                />
              </ButtonSet>
            </Content>
            <Content>
              <Grid container spacing={16}>
                <Grid item xs={12}>
                  <CheckResult check={event.check} entity={event.entity} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <RelatedEntitiesCard entity={event.entity} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Summary check={event.check} entity={event.entity} />
                </Grid>
              </Grid>
            </Content>
          </React.Fragment>
        )}
      </Loader>
    );
  }
}

export default EventDetailsContainer;
