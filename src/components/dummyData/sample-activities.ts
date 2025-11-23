// Sample activities for testing purposes

export const sample_activities = [
  { id: 1, description: "Went for a morning run", category_id: 1, timestamp: new Date().toISOString(), category: "Exercise", length_mins: 30 },
  { id: 2, description: "Ate oatmeal for breakfast", category_id: 2, timestamp: new Date().toISOString(), category: "Meals", length_mins: 15 },
  { id: 3, description: "Attended project meeting", category_id: 3, timestamp: new Date().toISOString(), category: "Work", length_mins: 60 },
  { id: 4, description: "Read a chapter of a book", category_id: 4, timestamp: new Date().toISOString(), category: "Learning", length_mins: 45 },
  { id: 5, description: "Did yoga", category_id: 1, timestamp: new Date().toISOString(), category: "Exercise", length_mins: 30 },
  { id: 6, description: "Cooked lunch", category_id: 2, timestamp: new Date().toISOString(), category: "Meals", length_mins: 30 },
  { id: 7, description: "Worked on app development", category_id: 3, timestamp: new Date().toISOString(), category: "Work", length_mins: 120 },
  { id: 8, description: "Watched a documentary", category_id: 5, timestamp: new Date().toISOString(), category: "Entertainment", length_mins: 90 },
  { id: 9, description: "Cleaned the kitchen", category_id: 6, timestamp: new Date().toISOString(), category: "Household", length_mins: 20 },
  { id: 10, description: "Had coffee with a friend", category_id: 7, timestamp: new Date().toISOString(), category: "Social", length_mins: 45 },
  { id: 11, description: "Played chess online", category_id: 5, timestamp: new Date().toISOString(), category: "Entertainment", length_mins: 60 },
  { id: 12, description: "Prepared dinner", category_id: 2, timestamp: new Date().toISOString(), category: "Meals", length_mins: 40 },
  { id: 13, description: "Went for a walk", category_id: 1, timestamp: new Date().toISOString(), category: "Exercise", length_mins: 30 },
  { id: 14, description: "Watched a movie", category_id: 5, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), category: "Entertainment", length_mins: 120 },
  { id: 15, description: "Did laundry", category_id: 6, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), category: "Household", length_mins: 60 },
  { id: 16, description: "Meditated", category_id: 8, timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), category: "Health", length_mins: 20 },
];