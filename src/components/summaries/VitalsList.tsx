import '../../Home.css';
import React from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';

interface VitalsListProps {
  fhirData?: FHIRData,
  vitalSignSummary?: [ObservationSummary],
}

interface VitalsListState {
}

export const VitalsList: React.FC<VitalsListProps> = (props: VitalsListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("VitalsList component RENDERED!")

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Vitals</h4>

        {props.fhirData === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirData === undefined} />
          </>
        }

        {props.vitalSignSummary && props.vitalSignSummary.length > 0 && props.vitalSignSummary[0]?.ConceptName === 'init'
          ? <p>Loading...</p>
          : (!props.vitalSignSummary || props.vitalSignSummary.length < 1) && props.fhirData !== undefined
            ? <p>No records found.</p>
            :
            <>
              {props.vitalSignSummary?.map((obs, idx) => (
                <Summary key={idx} id={idx} rows={buildRows(obs)} />
              ))}
            </>
        }

      </div>
    </div>
  )

}

const buildRows = (obs: ObservationSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: obs.DisplayName,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ResultText,
        data2: displayDate(obs.Date),
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: "Performed by: " + (obs.Performer ?? 'Unknown'),
        data2: '',
      },
    ]

  const provenance: SummaryRowItems | undefined = obs.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: true,
      data1: 'Source: ' + provenance.Transmitter ?? '',
      data2: provenance.Author ?? '',
    }
  ))
  if (provenance?.length) {
    rows = rows.concat(provenance)
  }

  return rows
}
