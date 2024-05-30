import '../../Home.css';
import React, { FC, useState, useEffect } from 'react';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { ObservationSummary } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface VitalsListProps {
  fhirDataCollection?: FHIRData[];
  vitalSignSummaryMatrix?: ObservationSummary[][];
}

export const VitalsList: FC<VitalsListProps> = ({ fhirDataCollection, vitalSignSummaryMatrix }) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("VitalsList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>('');
  const [filteringOption, setFilteringOption] = useState<string[]>([]);
  const [sortedAndFilteredVitals, setSortedAndFilteredVitals] = useState<{ vital: ObservationSummary, provider: string }[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    applySortingAndFiltering();
  }, [vitalSignSummaryMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (vitalSignSummaryMatrix) {
      generateFilteringOptions();
    }
  }, [vitalSignSummaryMatrix]);

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
    if (!vitalSignSummaryMatrix || !fhirDataCollection) return;

    // Flatten the vitalSignSummaryMatrix to a single array with provider information
    let combinedVitals: { vital: ObservationSummary, provider: string }[] = [];
    vitalSignSummaryMatrix.forEach((providerVitals, providerIndex) => {
      const providerName = fhirDataCollection[providerIndex].serverName || 'Unknown';
      providerVitals.forEach(vital => {
        combinedVitals.push({ vital, provider: providerName });
      });
    });

    // Apply filtering
    if (filteringOption.length > 0) {
      combinedVitals = combinedVitals.filter(({ provider }) => filteringOption.includes(provider));
    }

    // Apply sorting
    switch (sortingOption) {
      case 'alphabetical-az':
        combinedVitals.sort((a, b) => (a.vital.DisplayName || '').localeCompare(b.vital.DisplayName || ''));
        break;
      case 'alphabetical-za':
        combinedVitals.sort((a, b) => (b.vital.DisplayName || '').localeCompare(a.vital.DisplayName || ''));
        break;
      case 'newest':
        combinedVitals.sort((a, b) => (b.vital.Date || '').localeCompare(a.vital.Date || ''));
        break;
      case 'oldest':
        combinedVitals.sort((a, b) => (a.vital.Date || '').localeCompare(b.vital.Date || ''));
        break;
      default:
        break;
    }

    setSortedAndFilteredVitals(combinedVitals);
  };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Vitals</h4>

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

        {sortedAndFilteredVitals.length === 0 ? (
          <p>No records found.</p>
        ) : (
          sortedAndFilteredVitals.map(({ vital, provider }, index) => (
            <Summary key={index} id={index} rows={buildRows(vital, provider)} />
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
  ];

  if (theSource) {
    const rowItem: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: "From " + theSource,
      data2: '',
    };
    rows.push(rowItem);
  }

  const provenance: SummaryRowItems | undefined = obs.Provenance?.map((provenance) => (
    {
      isHeader: false,
      twoColumns: true,
      data1: 'Source: ' + (provenance.Transmitter ?? ''),
      data2: provenance.Author ?? '',
    }
  ));
  if (provenance?.length) {
    rows = rows.concat(provenance);
  }

  return rows;
}
