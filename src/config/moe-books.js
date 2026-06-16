// Oman MOE English books database - extracted from ict.moe.gov.om/book/XMLjs/class{N}.js
// Format: books[] = { id, name, type }
// PDF path: /book/PDF/{grade}/{bookId}/files/downloads/{bookId}.pdf

const MOE_BOOKS = {
  1: [
    { id: 'cls1_Class_book_1A', name: 'Class Book 1A', section: 'English' },
    { id: 'cls1_ClassBook_1B', name: 'Class Book 1B', section: 'English' },
    { id: 'cls1_Activity_Book_A1', name: 'Activity Book 1A', section: 'English' },
    { id: 'cls1_ActivityBook_1B', name: 'Activity Book 1B', section: 'English' },
    { id: 'cls1_Sounds_And_Spelling_book_A1', name: 'Sounds & Spelling 1A', section: 'English' },
    { id: 'cls1_1B_SS', name: 'Sounds & Spelling 1B', section: 'English' },
  ],
  2: [
    { id: 'cls2_Class_book_2A', name: 'Class Book 2A', section: 'English' },
    { id: 'cls2_Class_book_2B', name: 'Class Book 2B', section: 'English' },
    { id: 'cls2_Activity_Book_2A', name: 'Activity Book 2A', section: 'English' },
    { id: 'cls2_ActivityBook_2B', name: 'Activity Book 2B', section: 'English' },
    { id: 'cls2_Sounds_And_Spelling_book_2A', name: 'Sounds & Spelling 2A', section: 'English' },
    { id: 'cls2_Sounds_And_Spelling_book_2B', name: 'Sounds & Spelling 2B', section: 'English' },
  ],
  3: [
    { id: 'cls3_3A_CB', name: 'Class Book 3A', section: 'English' },
    { id: 'cls3_3B_CB', name: 'Class Book 3B', section: 'English' },
    { id: 'cls3_3A_AB', name: 'Activity Book 3A', section: 'English' },
    { id: 'cls3_3B_AB', name: 'Activity Book 3B', section: 'English' },
  ],
  4: [
    { id: 'cls4_Class_book_4A', name: 'Class Book 4A', section: 'English' },
    { id: 'cls4_Class_book_4B', name: 'Class Book 4B', section: 'English' },
    { id: 'cls4_Activity_Book_4A', name: 'Activity Book 4A', section: 'English' },
    { id: 'cls4_Activity_Book_4B', name: 'Activity Book 4B', section: 'English' },
  ],
  5: [
    { id: 'cls5_cb_5A', name: 'Class Book 5A', section: 'English' },
    { id: 'cls5_CB_5B', name: 'Class Book 5B', section: 'English' },
    { id: 'cls5_Activity_5A', name: 'Activity Book 5A', section: 'English' },
    { id: 'cls5B_AB', name: 'Activity Book 5B', section: 'English' },
  ],
  6: [
    { id: 'cls6_cb_6A', name: 'Class Book 6A', section: 'English' },
    { id: 'cls6_Activity_Book_6A', name: 'Activity Book 6A', section: 'English' },
    { id: 'cls2B_CB', name: 'Class Book 6B', section: 'English' },
    { id: 'cls6B_WB', name: 'Activity Book 6B', section: 'English' },
    { id: 'cls6_cb_6B_eBooks', name: 'Class Book 6B (eBook)', section: 'English' },
  ],
  7: [
    { id: 'cls7_cb_7A', name: 'Class Book 7A', section: 'English' },
    { id: 'cls7_7B_CB', name: 'Class Book 7B', section: 'English' },
    { id: 'cls7_sb_7A', name: 'Skills Book 7A', section: 'English' },
    { id: 'cls7_7B_Act', name: 'Skills Book 7B', section: 'English' },
  ],
  8: [
    { id: 'cls8_cb_8A', name: 'Class Book 8A', section: 'English' },
    { id: 'cls8_8B_CB', name: 'Class Book 8B', section: 'English' },
    { id: 'cls8_Class_book_8A_eBooks', name: 'Class Book 8A (eBook)', section: 'English' },
    { id: 'cls8_Class_book_8B_eBooks', name: 'Class Book 8B (eBook)', section: 'English' },
  ],
  9: [
    { id: 'cls9_cb_9A', name: 'Class Book 9A', section: 'English' },
    { id: 'cls9_cb_9B', name: 'Class Book 9B', section: 'English' },
    { id: 'english_sb_g9p1_Classical', name: 'Skills Book 9A', section: 'English' },
    { id: 'cls9_sb_9B', name: 'Skills Book 9B', section: 'English' },
  ],
  10: [
    { id: 'cls10_cb_10A', name: 'Class Book 10A', section: 'English' },
    { id: 'classBook_cls10b', name: 'Class Book 10B', section: 'English' },
    { id: 'cls10_sb_10A', name: 'Skills Book 10A', section: 'English' },
    { id: 'english_sb_g10p2_Classical', name: 'Skills Book 10B', section: 'English' },
    { id: 'G10 story reader_Classical', name: 'Story Reader 10', section: 'English' },
  ],
  11: [
    { id: 'english_courseb_g11p1_Classical', name: 'Class Book 11A', section: 'English' },
    { id: 'english_courseb_g11p2_Classical', name: 'Class Book 11B', section: 'English' },
    { id: 'english_workb_g11p1_Classical', name: 'Work Book 11A', section: 'English' },
    { id: 'cls11_wb_11B', name: 'Work Book 11B', section: 'English' },
    { id: 'G11 story reader_Classical', name: 'Story Reader 11', section: 'English' },
    { id: 'cls11_Insights2_SB', name: 'Insights 2 Student Book', section: 'English' },
    { id: 'cls11_Insights2_WB', name: 'Insights 2 Work Book', section: 'English' },
  ],
  12: [
    { id: 'cls12_cb_12A', name: 'Class Book 12A', section: 'English' },
    { id: 'english_courseb_g12p2_Classical', name: 'Class Book 12B', section: 'English' },
    { id: 'cls12_wb_12A', name: 'Work Book 12A', section: 'English' },
  ],
};

module.exports = MOE_BOOKS;
