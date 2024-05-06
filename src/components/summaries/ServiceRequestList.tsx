import '../../Home.css';
import React, { FC, useState, useEffect } from 'react';
import { FHIRData, displayTiming, displayConcept } from '../../data-services/models/fhirResources';
import { ServiceRequest } from '../../data-services/fhir-types/fhir-r4';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { SortOnlyModal } from '../sort-only-modal/sortOnlyModal';

interface ServiceRequestListProps {
  fhirDataCollection?: FHIRData[];
}

export const ServiceRequestList: FC<ServiceRequestListProps> = ({fhirDataCollection}) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("ServiceRequestList component RENDERED!");

  const [sortedServiceRequests, setSortedServiceRequests] = useState<ServiceRequest[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<string>('');
  const [filterOption, setFilterOption] = useState<string[]>([]);
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);
  const [hashMap, setHashMap] = useState<Map<ServiceRequest, string>>(new Map());

  console.log("fhirDataCollection", fhirDataCollection);

  useEffect(() => {
    applySorting();
  }, [fhirDataCollection, sortOption, filterOption]);

  useEffect(() => {
    generateFilteringOptions();
  }, [fhirDataCollection]);

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSortFilterSubmit = (sortOption: string, filterOption?: string[]) => {
    setSortOption(sortOption);
    if(filterOption){
      setFilterOption(filterOption)
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

  const applySorting = () => {
    let serviceRequests: ServiceRequest[] = [];
  
    if (fhirDataCollection) {
      fhirDataCollection.forEach(data => {
        if (data.serviceRequests) {
          serviceRequests = serviceRequests.concat(data.serviceRequests);
        }
      });
    }
  
    let sortedServiceRequests = [...serviceRequests];
  
    if (sortOption === 'alphabetical-az') {
      sortedServiceRequests = sortedServiceRequests.sort((a, b) => {
        const nameA = a.code?.text ?? "";
        const nameB = b.code?.text ?? "";
        return nameA.localeCompare(nameB);
      });
    } else if (sortOption === 'alphabetical-za') {
      sortedServiceRequests = sortedServiceRequests.sort((a, b) => {
        const nameA = a.code?.text ?? "";
        const nameB = b.code?.text ?? "";
        return nameB.localeCompare(nameA);
      });
    } else if (sortOption === 'newest') {
      serviceRequests = serviceRequests.sort((a, b) => {
        const dateA = a.occurrenceTiming?.repeat ?? "";
        const dateB = b.occurrenceTiming?.repeat ?? "";
        console.log("dateA", dateA);
        return 1;
      });
    } else if (sortOption === 'oldest') {
      serviceRequests = serviceRequests.sort((a, b) => {
        const dateA = a.occurrenceTiming?.repeat ?? "";
        const dateB = b.occurrenceTiming?.repeat ?? "";
        return 1;
      });
    }
  
    if (filterOption) {
      }
  
    setSortedServiceRequests(sortedServiceRequests);
  };
  


  return (
    <div className="home-view">
      <div className="welcome">
        <h4 className="title">Planned Activities</h4>

        {fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={fhirDataCollection === undefined} />
          </>
        }

{fhirDataCollection && fhirDataCollection.length === 1 ? ( // Checking for single provider
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT
          </a>
        ) : (
          <a className="text-right" onClick={() => setShowModal(true)}>
            SORT/FILTER
          </a>
        )}
 {showModal && ( // Conditional rendering of modal based on the number of providers
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

        {sortedServiceRequests.length > 0 ? (
          sortedServiceRequests.map((service, idx) => (
            <Summary key={idx} id={idx} rows={buildRows(service, hashMap.get(service))} />
          ))
        ) : (
          <p>No records found.</p>
        )}

      </div>
    </div>
  );
};

const buildRows = (service: ServiceRequest, theSource?: string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: displayConcept(service.code) ?? "No description",
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.requester === undefined ? ''
          : 'Requested by: ' + service.requester?.display,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.occurrenceTiming === undefined ? ''
          : 'Scheduled on ' + displayTiming(service.occurrenceTiming),
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: service.reasonCode === undefined ? ''
          : 'Reason: ' + displayConcept(service.reasonCode?.[0]),
        data2: '',
      }
    ];

  const notes: SummaryRowItems | undefined = service.note?.map((note, idx) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: note.text ? 'Note ' + (idx + 1) + ': ' + note.text : '',
      data2: '',
    }
  ));
  if (notes?.length) {
    rows = rows.concat(notes);
  }

  if (theSource) {
    const rowItem: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: "From " + theSource,
      data2: '',
    };
    rows.push(rowItem);
  }

  return rows;
};
