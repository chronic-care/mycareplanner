import '../../Home.css'
import React from 'react'
import { FHIRData, displayDate, displayTiming, displayConcept } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary } from '../../data-services/models/cqlSummary'
import { TimingRepeat } from '../../data-services/fhir-types/fhir-r4';

interface ServiceRequestListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

export const ServiceRequestList: React.FC<ServiceRequestListProps> = (props: ServiceRequestListProps) => {

  let serviceRequests = props.fhirData?.serviceRequests

  // Sort by descending occurrenceTiming start date
  serviceRequests?.sort((sr1, sr2) => {
    let sr1BoundsPeriod = (sr1.occurrenceTiming?.repeat as TimingRepeat)?.boundsPeriod
    let sr1StartDate = sr1BoundsPeriod?.start !== undefined ? new Date(sr1BoundsPeriod.start) : undefined
    let sr2BoundsPeriod = (sr2.occurrenceTiming?.repeat as TimingRepeat)?.boundsPeriod
    let sr2StartDate = sr2BoundsPeriod?.start !== undefined ? new Date(sr2BoundsPeriod.start) : undefined
    
    if (sr1StartDate === undefined && sr2StartDate !== undefined) {
        return 1
    }
    if (sr1StartDate !== undefined && sr2StartDate === undefined) {
        return -1
    }
    if (sr1StartDate! < sr2StartDate!) {
        return 1;
    }
    if (sr1StartDate! > sr2StartDate!) {
        return -1;
    }
    return 0;
  })

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Planned Activities (Interventions)</h4>

        {serviceRequests === undefined || serviceRequests?.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {serviceRequests?.map((service, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    <tr><td><b>{displayConcept(service.code) ?? "No description"}</b></td></tr>
                    {(service.requester === undefined) ? '' :
                      <tr><td>Requested by: {service.requester?.display}</td></tr>
                    }
                    {/* {(service.authoredOn === undefined) ? '' :
                      <tr><td>Authored on: {displayDate(service.authoredOn)}</td></tr>
                    } */}
                    {(service.occurrenceTiming === undefined) ? '' :
                      <tr><td>Scheduled on {displayTiming(service.occurrenceTiming)}</td></tr>
                    }
                    {(service.reasonCode === undefined) ? '' :
                      <tr><td>Reason: {displayConcept(service.reasonCode?.[0])}</td></tr>
                    }
                    {service.note?.map((note, idx) => (
                      <tr key={idx}><td>Note: {note.text}</td></tr>
                    ))}
                  </tbody></table>
                </td>
              </tr>
            ))}
          </tbody></table>
        }

      </div>
    </div>
  )

}
