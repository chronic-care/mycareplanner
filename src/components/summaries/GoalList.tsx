import '../../Home.css';
import React , { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FHIRData, displayDate } from '../../data-services/models/fhirResources';
import { GoalSummary, GoalTarget } from '../../data-services/models/cqlSummary';
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary';
import { BusySpinner } from '../busy-spinner/BusySpinner';
import { SortModal } from '../sort-modal/sortModal';
import { Button } from '@mui/material';
interface GoalListProps {
  fhirDataCollection?: FHIRData[],
  goalSummaryMatrix?: GoalSummary[][],
  canShareData?: boolean,
}

export const GoalList: React.FC<GoalListProps> = (props: GoalListProps) => {
  process.env.REACT_APP_DEBUG_LOG === "true" && console.log("GoalList component RENDERED!")
  const [showModal, setShowModal] = useState(false);
  const [sortingOption, setSortingOption] = useState<string>(''); // State for sorting option
  const [filteringOption, setFilteringOption] = useState<string>(''); // State for filtering option
  const [sortedAndFilteredMatrix, setSortedAndFilteredMatrix] = useState<GoalSummary[][] | undefined>();
  const [filteringOptions, setFilteringOptions] = useState<{ value: string; label: string }[]>([]);

  const goalSumMatrix: GoalSummary[][] | undefined = props.goalSummaryMatrix

  useEffect(() => {
    applySortingAndFiltering();
  }, [goalSumMatrix, sortingOption, filteringOption]);

  useEffect(() => {
    if (goalSumMatrix) {
        generateFilteringOptions();
    }
}, [goalSumMatrix]);

  const closeModal = ()=>{
    setShowModal(false)
  }

  const handleSortFilterSubmit = (sortOption: string,  filterOption: string) => {
    setSortingOption(sortOption);
    setFilteringOption(filterOption);
    setShowModal(false);
  };

  const generateFilteringOptions = () => {
    if (!goalSumMatrix) return;

    const provenanceValues: string[] = [];

    goalSumMatrix.forEach(providerGoals => {
        providerGoals.forEach(goal => {
            goal.Provenance?.forEach(provenance => {
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

  const sortingOptions = [
    { value: 'alphabetical-az', label: 'Alphabetical: A-Z' },
    { value: 'alphabetical-za', label: 'Alphabetical: Z-A' },
    { value: 'newest', label: 'Date Created: Newest' },
    { value: 'oldest', label: 'Date Created: Oldest' }
];



const applySortingAndFiltering = () => {
  if (!goalSumMatrix) return;

  let sortedMatrix = goalSumMatrix;
  if (sortingOption === 'alphabetical-az') {
      sortedMatrix = goalSumMatrix.map(providerGoals =>
          [...providerGoals].sort((a, b) => (a.Description || '').localeCompare(b.Description || ''))
      );
  } else if (sortingOption === 'alphabetical-za') {
      sortedMatrix = goalSumMatrix.map(providerGoals =>
          [...providerGoals].sort((a, b) => (b.Description || '').localeCompare(a.Description || ''))
      );
  } else if (sortingOption === 'newest') {
      sortedMatrix = goalSumMatrix.map(providerGoals =>
          [...providerGoals].sort((a, b) => {
              if (a.StartDate && b.StartDate) {
                  return b.StartDate.localeCompare(a.StartDate);
              } else if (!a.StartDate) {
                  return 1;
              } else {
                  return -1;
              }
          })
      );
  } else if (sortingOption === 'oldest') {
      sortedMatrix = goalSumMatrix.map(providerGoals =>
          [...providerGoals].sort((a, b) => {
              if (a.StartDate && b.StartDate) {
                  return a.StartDate.localeCompare(b.StartDate);
              } else if (!a.StartDate) {
                  return -1;
              } else {
                  return 1;
              }
          })
      );
  }

  let filteredMatrix = sortedMatrix;
  if (filteringOption) {
    filteredMatrix = sortedMatrix.map(providerGoals =>
        providerGoals.filter(goal =>
            goal.Provenance?.some(provenance => provenance.Transmitter === filteringOption)
        )
    );
}

  setSortedAndFilteredMatrix(filteredMatrix);
};

    // // Function to sort the goalSumMatrix based on the selected option
    // const sortGoalSumMatrix = (matrix: GoalSummary[][] | undefined, option: string) => {
    //   // Implement sorting logic based on the selected option
    //   // For example, you can use array.sort() method
    //   // and update goalSumMatrix state with the sorted array
    // };
  
    // // Function to filter the goalSumMatrix based on the selected option
    // const filterGoalSumMatrix = (matrix: GoalSummary[][] | undefined, option: string) => {
    //   // Implement filtering logic based on the selected option
    //   // and update goalSumMatrix state with the filtered array
    // };

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Health Goals</h4>

        {props.fhirDataCollection === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirDataCollection === undefined} />
          </>
        }

        {props.canShareData
          ? <p><Link to={{ pathname: '/goal-edit', state: { fhirDataCollection: props.fhirDataCollection } }}>Add a New Goal</Link></p>
          : <p />}

        <a className='text-right' onClick={()=>setShowModal(true)}>SORT/FILTER</a>
        {showModal ? <SortModal showModal={showModal} closeModal={closeModal} onSubmit={handleSortFilterSubmit} sortingOptions={sortingOptions} filteringOptions={filteringOptions}/>:null}

        {
          sortedAndFilteredMatrix?.map((goalSummary, index) => {

            return (
              <div key={'outerArray-' + index}>
                {
                  goalSummary && goalSummary.length > 0 && goalSummary[0]?.Description === 'init'
                    ? <p>Loading...</p>
                    : (!goalSummary || goalSummary.length < 1) && props.fhirDataCollection !== undefined
                      ? <p>No records found.</p>
                      :
                      <div>
                        {goalSummary?.map((goal, idx) => (
                          <Summary key={idx} id={idx} rows={buildRows(goal,props.fhirDataCollection![index].serverName)} />
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

const buildRows = (goal: GoalSummary, theSource?:string): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: goal.Description,
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: goal.ExpressedBy,
        data2: goal.StartDate === null ? ''
          : 'Start: ' + displayDate(goal.StartDate),
      },
    ]

  const targets: SummaryRowItems = buildTargets(goal)
  if (targets?.length) {
    rows = rows.concat(targets)
  }

  const addresses: SummaryRowItems | undefined = goal.Addresses?.map((concern) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Addresses: ' + (concern.DisplayName ?? 'Unknown'),
      data2: '',
    }
  ))
  if (addresses?.length) {
    rows = rows.concat(addresses)
  }

  const learnMore: SummaryRowItem = {
    isHeader: false,
    twoColumns: false,
    data1: goal.LearnMore === undefined || goal.LearnMore === null ? '' :
      <Link to="route" target="_blank"
        onClick={
          (event) => { event.preventDefault(); window.open(goal.LearnMore); }
        }><i>Learn&nbsp;More</i>
      </Link>,
    data2: '',
  }
  rows.push(learnMore)

  const notes: SummaryRowItems | undefined = goal.Notes?.map((note) => (
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

  const provenance: SummaryRowItems | undefined = goal.Provenance?.map((provenance) => (
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

const buildTargets = (goal: GoalSummary): SummaryRowItems => {
  let targets: SummaryRowItems = []

  goal.Target?.forEach((curTarget) => {

    let isPushLastResultTextAndDateOnly: boolean = (curTarget.DueDate === null || curTarget.DueDate === undefined)
      && (curTarget.TargetValue === null || curTarget.TargetValue === undefined)

    let isPushTargetValueAndDueDateOnly: boolean = !curTarget.LastResult || !curTarget.LastResult.Date

    let isPushBoth = !isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly

    if (isPushLastResultTextAndDateOnly && !isPushTargetValueAndDueDateOnly) {
      // Skip targetValueAndDueDate, add lastResultTextAndDate only
      targets.push(buildLastResultTextAndDate(curTarget))
    } else if (isPushTargetValueAndDueDateOnly && !isPushLastResultTextAndDateOnly) {
      // Skip lastResultTextAndDate, add targetValueAndDueDate only
      targets.push(buildTargetValueAndDueDate(curTarget))
    } else if (isPushBoth) {
      // Push both targetValueAndDueDate and lastResultTextAndDate as enough data is valid
      targets.push(buildTargetValueAndDueDate(curTarget))
      targets.push(buildLastResultTextAndDate(curTarget))
    }

  })

  return targets
}

const buildLastResultTextAndDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: false,
    data1: 'Last Value: ' + (curTarget.LastResult?.ResultText ?? '?') + ' on ' + displayDate(curTarget.LastResult?.Date),
    data2: '',
  }
}

const buildTargetValueAndDueDate = (curTarget: GoalTarget): SummaryRowItem => {
  return {
    isHeader: false,
    twoColumns: true,
    data1: curTarget.TargetValue === null ? '' : 'Target: ' + curTarget?.TargetValue,
    data2: curTarget.DueDate === null ? '' : 'Due: ' + displayDate(curTarget?.DueDate),
  }
}