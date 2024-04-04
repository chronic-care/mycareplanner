import '../../Home.css';
import React, { useState, useEffect }  from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';

interface LabResultListProps {
  fhirDataCollection?: FHIRData[],
  labResultSummaryMatrix?: ObservationSummary[][],
}

interface LabResultListState {
}

export const LabResultList: React.FC<LabResultListProps> = (props: LabResultListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("LabResultList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string>('');
  const [sortedAndFilteredMatrix,setSortedAndFilteredMatrix] = useState<ObservationSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{value: string; label: string}[]>([]);
  
  const labResMatrix: ObservationSummary[][] | undefined = props.labResultSummaryMatrix

  useEffect(() => {
    applySortingAndFiltering();
  }, [props.labResultSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (props.labResultSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [props.labResultSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption: string) => {
    setSortingOption(sortOption);
    setFilteringOption(filterOption);
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!props.labResultSummaryMatrix) return;

    const provenanceValues: string[] = [];

    props.labResultSummaryMatrix.forEach(providerObservations => {
      providerObservations.forEach(observation => {
        observation.Provenance?.forEach(provenance => {
          if (provenance.Transmitter) {
            provenanceValues.push(provenance.Transmitter);
          }
        });
      });
    });

    const uniqueProvenanceValues = Array.from(new Set(provenanceValues));

    const options = uniqueProvenanceValues.map(value => ({
      value: value,
      label: value
    }));

    setFilteringOptions(options);
  };

  const applySortingAndFiltering = () => {
    if (!props.labResultSummaryMatrix) return;

    let sortedMatrix = props.labResultSummaryMatrix;
    if (sortingOption === 'alphabetical-az') {
      sortedMatrix = props.labResultSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (a.DisplayName ?? '').localeCompare(b.DisplayName ?? '')
        )
      );
    } else if (sortingOption === 'alphabetical-za') {
      sortedMatrix = props.labResultSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (b.DisplayName ?? '').localeCompare(a.DisplayName ?? '')
        )
      );
    } else if (sortingOption === 'newest') {
      sortedMatrix = props.labResultSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (b.Date ?? '').localeCompare(a.Date ?? '')
        )
      );
    } else if (sortingOption === 'oldest') {
      sortedMatrix = props.labResultSummaryMatrix.map(providerObservations =>
        [...providerObservations].sort((a, b) =>
          (a.Date ?? '').localeCompare(b.Date ?? '')
        )
      );
    }

    let filteredMatrix = sortedMatrix;
    if (filteringOption) {
      filteredMatrix = sortedMatrix.map(providerObservations =>
        providerObservations.filter(observation =>
          observation.Provenance?.some(
            provenance => provenance.Transmitter === filteringOption
          )
        )
      );
    }

    setSortedAndFilteredMatrix(filteredMatrix);
  };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        <a className="text-right" onClick={() => setShowModal(true)}>
          SORT/FILTER
        </a>
        {showModal ? (
          <SortModal
            showModal={showModal}
            closeModal={closeModal}
            onSubmit={handleSortFilterSubmit}
            sortingOptions={[
              { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
              { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
              { value: 'newest', label: 'Date: Newest' },
              { value: 'oldest', label: 'Date: Oldest' }
            ]}
            filteringOptions={filteringOptions}
          />
        ) : null}

        {
          sortedAndFilteredMatrix?.map((labResultSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {
                  labResultSummary && labResultSummary.length > 0 && labResultSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!labResultSummary || labResultSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {labResultSummary?.map((obs, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(obs,props.fhirDataCollection![index].serverName)} />
                        ))}
                      </div>
                }
              </div>
            )

          })
        }

      </div>
    </div>
  )

}

const buildRows = (obs: ObservationSummary, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: obs.DisplayName,
        data2: obs.LearnMore === undefined || obs.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(obs.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ResultText,
        data2: displayDate(obs.Date),
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: obs.ReferenceRange === null ? '' : 'Range: ' + obs.ReferenceRange,
        data2: obs.Interpretation,
      },
      /* May need to be implemented one day...
      {obs.Notes?.map((note, idx) => (
      <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
      ))} */
    ]

    if (theSource) {
      const source: SummaryRowItem = {
        isHeader: false,
        twoColumns: false,
        data1: 'From ' + theSource,
        data2: '',
      }
      rows.push(source)
    }
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
