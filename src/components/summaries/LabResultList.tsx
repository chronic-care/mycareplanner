import '../../Home.css';
import React, { FC, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface LabResultListProps {
  fhirDataCollection?: FHIRData[];
  labResultSummaryMatrix?: ObservationSummary[][];
}

export const LabResultList: FC<LabResultListProps> = ({ fhirDataCollection, labResultSummaryMatrix }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("LabResultList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredLabResults, setSortedAndFilteredLabResults] = useState<{ labResult: ObservationSummary, provider: string }[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [labResultSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (labResultSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [labResultSummaryMatrix]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortingOption(sortOption);
    if (filterOption) {
      setFilteringOption(filterOption);
    }
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!fhirDataCollection || fhirDataCollection.length === 0) {
      setFilteringOptions([]);
      return;
    }

    const uniqueServerNames = Array.from(new Set(fhirDataCollection.map(data => data.serverName)));
    const options = uniqueServerNames.map(value => ({
      value: value || '',
      label: value || '',
    }));

    setFilteringOptions(options);
  };

  const sortingOptions = [
    { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
    { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
    { value: 'newest', label: 'Date Created: Newest' },
    { value: 'oldest', label: 'Date Created: Oldest' },
  ];

  const applySortingAndFiltering = () => {
    if (!labResultSummaryMatrix || !fhirDataCollection) return;

    // Flatten the labResultSummaryMatrix to a single array with provider information
    let combinedLabResults: { labResult: ObservationSummary, provider: string }[] = [];
    labResultSummaryMatrix.forEach((providerLabResults, providerIndex) => {
      const providerName = fhirDataCollection[providerIndex].serverName || 'Unknown';
      providerLabResults.forEach(labResult => {
        combinedLabResults.push({ labResult, provider: providerName });
      });
    });

    // Apply filtering
    if (filteringOption.length > 0) {
      combinedLabResults = combinedLabResults.filter(({ provider }) => filteringOption.includes(provider));
    }

    // Apply sorting
    switch (sortingOption) {
      case 'alphabetical-az':
        combinedLabResults.sort((a, b) => (a.labResult.DisplayName || '').localeCompare(b.labResult.DisplayName || ''));
        break;
      case 'alphabetical-za':
        combinedLabResults.sort((a, b) => (b.labResult.DisplayName || '').localeCompare(a.labResult.DisplayName || ''));
        break;
      case 'newest':
        combinedLabResults.sort((a, b) => (b.labResult.Date || '').localeCompare(a.labResult.Date || ''));
        break;
      case 'oldest':
        combinedLabResults.sort((a, b) => (a.labResult.Date || '').localeCompare(b.labResult.Date || ''));
        break;
      default:
        break;
    }

    setSortedAndFilteredLabResults(combinedLabResults);
  };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {fhirDataCollection === undefined && (
          <>
            <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        )}

        {fhirDataCollection && fhirDataCollection.length === 1 ? (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}

        {showModal && (
          fhirDataCollection && fhirDataCollection.length === 1 ? (
            <SortOnlyModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
            />
          ) : (
            <SortModal
              showModal={showModal}
              closeModal={closeModal}
              onSubmit={handleSortFilterSubmit}
              sortingOptions={sortingOptions}
              filteringOptions={filteringOptions}
            />
          )
        )}

        {sortedAndFilteredLabResults.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredLabResults.map(({ labResult, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(labResult, provider)} />
          ))
        )}
      </div>
    </div>
  );

}

const buildRows = (obs: ObservationSummary, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems = [
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
  ];

  if (obs.ReferenceRange !== null) {
    const row: SummaryRowItem = {
      isHeader: false,
      twoColumns: true,
      data1: 'Range: ' + obs.ReferenceRange,
      data2: obs.Interpretation,
    }
    rows.push(row)
  }

  const notes: SummaryRowItems | undefined = obs.Notes?.map((note) => (
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

  const provenance: SummaryRowItems | undefined = obs.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Source: ' + provenance.Transmitter ?? '',
      data2: provenance.Author ?? '',
    }
  ))
  if (provenance?.length) {
    rows = rows.concat(provenance)
  }

  const hasProvenance = obs.Provenance?.length ?? 0 > 0
  if (theSource && !hasProvenance) {
    const source: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Source: ' + theSource,
      data2: '',
    }
    rows.push(source)
  }

  return rows;
}
