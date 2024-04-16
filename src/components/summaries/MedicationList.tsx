import '../../Home.css';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { MedicationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';

interface MedicationListProps {
  fhirDataCollection?: FHIRData[],
  medicationSummaryMatrix?: MedicationSummary[][],
}

interface MedicationListState {
}

export const MedicationList: React.FC<MedicationListProps> = (props: MedicationListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("MedicationList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string>('');
  const [sortedAndFilteredMatrix, setSortedAndFilteredMatrix] = useState<MedicationSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  const medSumMatrix: MedicationSummary[][] | undefined = props.medicationSummaryMatrix

 console.log("MedicationListSum",medSumMatrix);

 useEffect(() => {
  applySortingAndFiltering();
}, [props.medicationSummaryMatrix, sortingOption, filteringOption]);

useEffect(() => {
  if (props.medicationSummaryMatrix) {
    generateFilteringOptions();
  }
}, [props.medicationSummaryMatrix]);

const closeModal = () => {
  setShowModal(false);
};

const handleSortFilterSubmit = (sortOption: string, filterOption: string) => {
  setSortingOption(sortOption);
  setFilteringOption(filterOption);
  setShowModal(false);
};

const generateFilteringOptions = () => {
  if (!props.medicationSummaryMatrix) return;

  const provenanceValues: string[] = [];

  props.medicationSummaryMatrix.forEach(providerMedications => {
    providerMedications.forEach(medication => {
      medication.Provenance?.forEach(provenance => {
        if (provenance.Transmitter) {
          provenanceValues.push(provenance.Transmitter);
        }
      });
    });
  });

  const uniqueProvenanceValues = Array.from(new Set(provenanceValues));

  const options = uniqueProvenanceValues.map(value => ({
    value: value,
    label: value,
  }));

  setFilteringOptions(options);
};

const applySortingAndFiltering = () => {
  if (!props.medicationSummaryMatrix) return;

  let sortedMatrix = props.medicationSummaryMatrix;
  if (sortingOption === 'alphabetical-az') {
    sortedMatrix = props.medicationSummaryMatrix.map(providerMedications =>
      [...providerMedications].sort((a, b) => (a.ConceptName ?? '').localeCompare(b.ConceptName ?? ''))
    );
  } else if (sortingOption === 'alphabetical-za') {
    sortedMatrix = props.medicationSummaryMatrix.map(providerMedications =>
      [...providerMedications].sort((a, b) => (b.ConceptName ?? '').localeCompare(a.ConceptName ?? ''))
    );
  } else if (sortingOption === 'newest') {
    sortedMatrix = props.medicationSummaryMatrix.map(providerMedications =>
      [...providerMedications].sort((a, b) => (b.AuthoredOn ?? '').localeCompare(a.AuthoredOn ?? ''))
    );
  } else if (sortingOption === 'oldest') {
    sortedMatrix = props.medicationSummaryMatrix.map(providerMedications =>
      [...providerMedications].sort((a, b) => (a.AuthoredOn ?? '').localeCompare(b.AuthoredOn ?? ''))
    );
  }

  let filteredMatrix = sortedMatrix;
  if (filteringOption) {
    filteredMatrix = sortedMatrix.map(providerMedications =>
      providerMedications.filter(medication =>
        medication.Provenance?.some(provenance => provenance.Transmitter === filteringOption)
      )
    );
  }

  setSortedAndFilteredMatrix(filteredMatrix);
};

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Medications</h4>

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
              { value: 'newest', label: 'Date Authored: Newest' },
              { value: 'oldest', label: 'Date Authored: Oldest' },
            ]}
            filteringOptions={filteringOptions}
          />
        ) : null}

        {
          sortedAndFilteredMatrix?.map((medicationSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
             
                {/* TODO:MULTI-PROVIDER: ConceptName === 'init' needs to refer to either medSumMatrix as a whole,
                 or, we need to initialize all possible rows (how do we know the # ahead of time?) to init vs just the first row.
                 Or, we need a better solution altogether. This applies to ALL summaries which use a summary matrix for display data
                 For now though, it's irrelevant as the data is all loaded ahead of time. If it's a massive data set, it may become relevant */}
                {
                  medicationSummary && medicationSummary.length > 0 && medicationSummary[0]?.ConceptName === 'init'
                    ? <p>Loading...</p>
                    : (!medicationSummary || medicationSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {medicationSummary?.map((med, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(med,props.fhirDataCollection![index].serverName)} />
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

const buildRows = (med: MedicationSummary, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: med.ConceptName ?? "No text",
        data2: med.LearnMore === undefined || med.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(med.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: displayDate(med.AuthoredOn),
        data2: 'By: ' + (med.Requester ?? 'Unknown'),
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: med.DosageInstruction,
        data2: '',
      },
    ]

  const notes: SummaryRowItems | undefined = med.Notes?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Note: ' + note,
      data2: '',
    }
  ))
  if (notes?.length) {
    rows = rows.concat(notes)
  }

  if (theSource) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'From ' + theSource,
      data2: '',
    }
    rows.push(source)
  }

  const provenance: SummaryRowItems | undefined = med.Provenance?.map((provenance) => (
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
