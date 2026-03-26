import { BackendSimulationResponse } from "../../../../types/ielts-simulation";

export const MOCK_SIMULATION_DATA: BackendSimulationResponse = {
    "id": "3aef5001-8948-4b15-b94f-dc7cbdaaf8de",
    "title": "IELTS Week 1 Simulation",
    "description": "Comprehensive Reading, Listening, and Writing test (Week 1)",
    "status": "ACTIVE",
    "duration_minutes": 160,
    "is_practice": true,
    "listening_test": {
        "id": "c88dce6a-b4f8-4432-b910-2da401704b9f",
        "duration_minutes": 40,
        "instructions": "You will hear four recordings. Answer the questions as you listen. You will have time to check your answers at the end of each section.",
        "audio_url": null,
        "sections": [
            {
                "id": "365e8845-aa99-4bf5-b962-6d1b8554fd78",
                "section_number": 1,
                "title": "Section 1 - Registration Form",
                "context": "A conversation between a police officer and a woman reporting a robbery.",
                "audio_url": null,
                "instructions": "Complete the form below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.",
                "questions": [
                    {
                        "id": "766b1d23-0347-4cc7-b728-f090852b3db8",
                        "question_number": 1,
                        "question_text": "Name: Anna ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "4e277960-28ec-4272-a183-475f11c9f417",
                        "question_number": 2,
                        "question_text": "Date of Birth (dd/mm/yyyy): ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "2742853d-6011-406c-984a-d160a7ea21cb",
                        "question_number": 3,
                        "question_text": "Address: 4 ______ St.",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "8ba00d38-c9ba-4270-a69b-1e63bf7ca9a9",
                        "question_number": 4,
                        "question_text": "Post code: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "6d948945-80ea-4157-a4fa-a1601c7d6216",
                        "question_number": 5,
                        "question_text": "Number of previous burglaries: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "5d71c917-5e03-4287-830f-f454047ed7ab",
                        "question_number": 6,
                        "question_text": "Time of apartment tenancy: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "a5e72447-9e57-4629-aaad-ba69e7718c91",
                        "question_number": 7,
                        "question_text": "Number of occupants: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "4024cc27-8502-47e6-879a-e7b838fc9990",
                        "question_number": 8,
                        "question_text": "Entry point of burglar: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "900344d7-d275-42d0-b892-8c4679a3ecde",
                        "question_number": 9,
                        "question_text": "Serial number of lost computer: ______",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "95c0cb62-c7bf-4aa0-bc6d-4d07abcac468",
                        "question_number": 10,
                        "question_text": "Material of stolen purse: ______ Cloth",
                        "question_context": "Registration Form",
                        "question_category": "FORM_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    }
                ]
            },
            {
                "id": "cbe9f882-ea3d-453a-9729-565b79323ee9",
                "section_number": 2,
                "title": "Section 2 - Business School Project",
                "context": "A conversation between two students, Mark and Gina, discussing their project.",
                "audio_url": null,
                "instructions": "Choose the correct letter, A, B or C, and complete the table.",
                "questions": [
                    {
                        "id": "4e3c017b-60d3-46e3-af74-1436ccede699",
                        "question_number": 11,
                        "question_text": "What is the project that Mark and Gina want to start?",
                        "question_context": "Questions 11-14",
                        "question_category": "MCQ_SINGLE",
                        "answer_input_type": "RADIO_SINGLE",
                        "options": [
                            { "id": "o11a", "label": "A", "text": "business school requirements", "order": 1 },
                            { "id": "o11b", "label": "B", "text": "directions to the business school", "order": 2 },
                            { "id": "o11c", "label": "C", "text": "explaining the business school experience", "order": 3 }
                        ]
                    },
                    {
                        "id": "f2882b37-dd37-44eb-9b42-aa64fdf5aa8f",
                        "question_number": 12,
                        "question_text": "Who is the target audience?",
                        "question_context": "Questions 11-14",
                        "question_category": "MCQ_SINGLE",
                        "answer_input_type": "RADIO_SINGLE",
                        "options": [
                            { "id": "o12a", "label": "A", "text": "business students", "order": 1 },
                            { "id": "o12b", "label": "B", "text": "business school applicants", "order": 2 },
                            { "id": "o12c", "label": "C", "text": "summer school attendees", "order": 3 }
                        ]
                    },
                    {
                        "id": "0f4f40ec-8db6-4dbb-86d2-b82e40617cea",
                        "question_number": 13,
                        "question_text": "How will they convey the information?",
                        "question_context": "Questions 11-14",
                        "question_category": "MCQ_SINGLE",
                        "answer_input_type": "RADIO_SINGLE",
                        "options": [
                            { "id": "o13a", "label": "A", "text": "summer course lecture", "order": 1 },
                            { "id": "o13b", "label": "B", "text": "informational video", "order": 2 },
                            { "id": "o13c", "label": "C", "text": "pamphlet in the mail", "order": 3 }
                        ]
                    },
                    {
                        "id": "da1fa59f-7e7b-4ed1-9091-a5ca959d8625",
                        "question_number": 14,
                        "question_text": "They want to do this project because",
                        "question_context": "Questions 11-14",
                        "question_category": "MCQ_SINGLE",
                        "answer_input_type": "RADIO_SINGLE",
                        "options": [
                            { "id": "o14a", "label": "A", "text": "students worry about their studies.", "order": 1 },
                            { "id": "o14b", "label": "B", "text": "they want to obtain a good grade.", "order": 2 },
                            { "id": "o14c", "label": "C", "text": "they want to attract future business school applicants.", "order": 3 }
                        ]
                    },
                    {
                        "id": "4bb75c35-5868-4891-b8e6-969b594558ec",
                        "question_number": 15,
                        "question_text": "Academics - ______",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "c353a6be-44b8-4273-966e-328a764b3edf",
                        "question_number": 16,
                        "question_text": "______ (main topic with Cafeteria as subtopic)",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "43165a09-1baf-44d3-9667-4591eeab8672",
                        "question_number": 17,
                        "question_text": "Accommodation subtopic - ______",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "d3ea7211-ac61-436a-8039-0d0a3deba8f6",
                        "question_number": 18,
                        "question_text": "Social activities - ______",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "f10d2b01-1dee-4f59-8903-bcdb342e85c0",
                        "question_number": 19,
                        "question_text": "Social activities - ______ (second item)",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    },
                    {
                        "id": "fd2617b1-2f82-4a68-88d4-506b7050c518",
                        "question_number": 20,
                        "question_text": "Conclusion nearly ______",
                        "question_context": "Questions 15-20",
                        "question_category": "TABLE_COMPLETION",
                        "answer_input_type": "TEXT_INPUT",
                        "word_limit": 2,
                        "options": []
                    }
                ]
            },
            {
                "id": "5250d9d9-e474-43bc-a919-88643c3ec584",
                "section_number": 3,
                "title": "Section 3 - Questionnaire Discussion",
                "context": "A conversation between two students, John and Dani, discussing a questionnaire project.",
                "audio_url": null,
                "instructions": "Choose the correct letter, A, B or C, and match the items to sources A-F.",
                "questions": [
                    {
                        "id": "q21", "question_number": 21, "question_text": "The subjects in questionnaire are", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [
                            { "id": "o21a", "label": "A", "text": "tourists in the hotel in this area.", "order": 1 },
                            { "id": "o21b", "label": "B", "text": "local residents.", "order": 2 },
                            { "id": "o21c", "label": "C", "text": "people who are living in this area.", "order": 3 }
                        ]
                    },
                    {
                        "id": "q22", "question_number": 22, "question_text": "The results of the questionnaire should be", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [
                            { "id": "o22a", "label": "A", "text": "directly entered into the computer.", "order": 1 },
                            { "id": "o22b", "label": "B", "text": "scored by hand.", "order": 2 },
                            { "id": "o22c", "label": "C", "text": "submitted directly to Professor Curran.", "order": 3 }
                        ]
                    },
                    {
                        "id": "q23", "question_number": 23, "question_text": "Why should John give a copy of plans to the professor?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [
                            { "id": "o23a", "label": "A", "text": "to receive a good grade", "order": 1 },
                            { "id": "o23b", "label": "B", "text": "to get advice", "order": 2 },
                            { "id": "o23c", "label": "C", "text": "to earn high praise", "order": 3 }
                        ]
                    },
                    { "id": "q24", "question_number": 24, "question_text": "How will the instructions be presented?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o24a", "label": "A", "text": "given by a group representative", "order": 1 }, { "id": "o24b", "label": "B", "text": "given by all members of the group", "order": 2 }, { "id": "o24c", "label": "C", "text": "given by the professor", "order": 3 }] },
                    { "id": "q25", "question_number": 25, "question_text": "What does Dani suggest to John?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o25a", "label": "A", "text": "divide into 2 parts", "order": 1 }, { "id": "o25b", "label": "B", "text": "focus on opinion", "order": 2 }, { "id": "o25c", "label": "C", "text": "consider both sides", "order": 3 }] },
                    { "id": "q26", "question_number": 26, "question_text": "Why is this project important to John?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o26a", "label": "A", "text": "to earn respect", "order": 1 }, { "id": "o26b", "label": "B", "text": "to raise his grade", "order": 2 }, { "id": "o26c", "label": "C", "text": "to impress his professor", "order": 3 }] },
                    { "id": "q27", "question_number": 27, "question_text": "Map", "question_category": "MATCHING_LIST", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "q28", "question_number": 28, "question_text": "Photo", "question_category": "MATCHING_LIST", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "q29", "question_number": 29, "question_text": "Budget", "question_category": "MATCHING_LIST", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "q30", "question_number": 30, "question_text": "Comment", "question_category": "MATCHING_LIST", "answer_input_type": "TEXT_INPUT", "options": [] }
                ]
            },
            {
                "id": "0de3fd50-10f2-4c47-8156-946cb747e0cb",
                "section_number": 4,
                "title": "Section 4 - Pleasanton Town Market Lecture",
                "context": "A university lecture about the history of the Pleasanton Town Market.",
                "audio_url": null,
                "instructions": "Choose the correct letter, A, B or C, and complete the table with ONE WORD ONLY.",
                "questions": [
                    { "id": "q31", "question_number": 31, "question_text": "Why did the lecturer choose this topic?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o31a", "label": "A", "text": "First ever Market", "order": 1 }, { "id": "o31b", "label": "B", "text": "Local history classes", "order": 2 }, { "id": "o31c", "label": "C", "text": "Library literature", "order": 3 }] },
                    { "id": "q32", "question_number": 32, "question_text": "Large profit selling...", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o32a", "label": "A", "text": "handcrafts", "order": 1 }, { "id": "o32b", "label": "B", "text": "vegetables", "order": 2 }, { "id": "o32c", "label": "C", "text": "animals", "order": 3 }] },
                    { "id": "q33", "question_number": 33, "question_text": "Money contributes to local...", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o33a", "label": "A", "text": "reconstruction", "order": 1 }, { "id": "o33b", "label": "B", "text": "development", "order": 2 }, { "id": "o33c", "label": "C", "text": "defense", "order": 3 }] },
                    { "id": "q34", "question_number": 34, "question_text": "Sales plummeted due to...", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o34a", "label": "A", "text": "agriculture", "order": 1 }, { "id": "o34b", "label": "B", "text": "transport", "order": 2 }, { "id": "o34c", "label": "C", "text": "city planning", "order": 3 }] },
                    { "id": "q35", "question_number": 35, "question_text": "Clock tower used as a...", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o35a", "label": "A", "text": "clock", "order": 1 }, { "id": "o35b", "label": "B", "text": "grounds for battle", "order": 2 }, { "id": "o35c", "label": "C", "text": "jail", "order": 3 }] },
                    { "id": "q36", "question_number": 36, "question_text": "Objects: ______", "question_category": "TABLE_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "q37", "question_number": 37, "question_text": "Objects: War veterans", "question_category": "TABLE_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "q38", "question_number": 38, "question_text": "Problems: bias makes it ______", "question_category": "TABLE_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "q39", "question_number": 39, "question_text": "Objects: Jim Wiley", "question_category": "TABLE_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "q40", "question_number": 40, "question_text": "Objects: ______", "question_category": "TABLE_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] }
                ]
            }
        ]
    },
    "reading_test": {
        "id": "d7455857-12b6-443d-97a7-b7fd8dbcb189",
        "duration_minutes": 60,
        "instructions": "The Reading section has two passages. You should spend about 20 minutes on each passage. Read the passage and answer the questions that follow. Write your answers in the spaces provided. Some questions may require you to choose from a list of options; others may require a short answer, a word or a number, or matching items. Answer all questions. Your answers should be based on the passage only.",
        "passages": [
            {
                "id": "7a8783cd-f572-4263-9620-0e72772b4cee",
                "passage_number": 1,
                "title": "Radiocarbon Dating - The Profile of Nancy Athfield",
                "content": "Have you ever picked up a small stone off the ground and wondered how old it was? For archaeologists and historians, determining the age of organic materials has been transformed by a technique known as radiocarbon dating. This method, developed in the late 1940s, allows scientists to measure the age of once-living matter up to approximately 50,000 years old. The story of how this technique came to be used across the world—from Cambodian temples to Pacific artefacts—is closely linked to the work of New Zealand scientist Nancy Athfield. Nancy Athfield first became involved in radiocarbon dating through her work at the Rafter Radiocarbon Laboratory in Lower Hutt, New Zealand. She had not originally set out to work in the sciences; during her mid-teens, she was not expected to attend university, but she later completed a PhD that focused on a particular kind of archaeological research. Her early work examined bone samples from Pacific Island sites, and she was often critical of the way that subject bias in sampling could account for fault in earlier studies. After establishing her reputation in the Pacific region, she took a professional break before going back to the field. When she returned to Southeast Asia, a lack of local laboratory facilities was at first a barrier. She nevertheless compiled the first comprehensive radiocarbon chronology of Cambodia, working with French and Cambodian colleagues to date materials from the temples of Angkor and other sites. The ancient remains found in Cambodia were often in poor condition, having been exposed to tropical weather and vegetation for centuries. Filmmakers and researchers have aimed to discover how Angkor was built and rebuilt over time. Nancy doubted whether the royal family had remained in Cambodia during the period of decline, and her analysis of human remains helped to disprove the theory that certain skeletons belonged to the royal family. Her work has given historians a clearer picture of the rise and fall of one of Southeast Asia's greatest civilisations.",
                "word_count": 980,
                "questions": [
                    { "id": "r1-1", "question_number": 1, "question_text": "Nancy Athfield first discovered the ancient remains in Cambodia.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-2", "question_number": 2, "question_text": "The remains found in Cambodia were in good condition.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-3", "question_number": 3, "question_text": "Nancy took some time off to do research in Cambodia.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-4", "question_number": 4, "question_text": "The Cambodia government boosted Nancy's work.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-5", "question_number": 5, "question_text": "Filmmakers aimed to find how Angkor was rebuilt.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-6", "question_number": 6, "question_text": "Nancy doubted whether royal family was in Cambodia.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-7", "question_number": 7, "question_text": "Nancy disproved remains belonged to royal family.", "question_category": "TRUE_FALSE_NOT_GIVEN", "answer_input_type": "TFNG_SELECT", "options": [] },
                    { "id": "r1-8", "question_number": 8, "question_text": "During mid-teens, Nancy wasn't expected to attend ______", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "r1-9", "question_number": 9, "question_text": "PhD degree was researching kind of ______", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "r1-10", "question_number": 10, "question_text": "Subject's ______ accounted for fault.", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "r1-11", "question_number": 11, "question_text": "Professional ______ before going back.", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "r1-12", "question_number": 12, "question_text": "Returned Cambodia, lack of ______ was barrier.", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] },
                    { "id": "r1-13", "question_number": 13, "question_text": "Compiled the ______ of Cambodia.", "question_category": "FLOWCHART_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 1, "options": [] }
                ]
            },
            {
                "id": "91fddb94-73a5-456f-bef4-a1646563e06c",
                "passage_number": 2,
                "title": "Stress of Workplace",
                "content": "A. How busy is too busy? For many people, work stress has become a normal part of life. Researchers have found that stress at work usually happens when demands are high and control is low—often at senior levels where decisions have serious consequences. Dr Sarah Plumridge, a psychologist who has studied workplace wellbeing for over twenty years, argues that the key is not to work less but to work more effectively. She points out that taking a temporary holiday does not necessarily mean less work; the backlog often grows while we are away. Moreover, stress can lead us in the wrong direction, making us focus on short-term fixes rather than long-term solutions. B. More people, more relief? Some employers believe that hiring more staff will reduce pressure on existing teams. Plumridge is cautious about this view. She suggests that more people can be beneficial for relief only if roles and responsibilities are clearly defined. Without that, extra staff can add to coordination costs and communication overload. She also notes that stress is often more severe in the present moment than we expect it to be in the future—we tend to imagine that things will get easier, but without changes to how we work, they may not. C. What actually helps? Plumridge emphasises several strategies: protecting time for family and rest, improving concentration by reducing interruptions, and paying attention to sleep and exercise. She has rarely mentioned formal appointments or therapy in her public talks, focusing instead on everyday habits. Her message is that managing workload is not about doing more in less time but about deciding what really matters and protecting the capacity to do it well.",
                "word_count": 1250,
                "questions": [
                    { "id": "r2-14", "question_number": 14, "question_text": "Work stress usually happens in high level.", "question_category": "MATCHING_FEATURES", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "r2-15", "question_number": 15, "question_text": "More people beneficial for relief.", "question_category": "MATCHING_FEATURES", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "r2-16", "question_number": 16, "question_text": "Temporary holiday doesn't mean less work.", "question_category": "MATCHING_FEATURES", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "r2-17", "question_number": 17, "question_text": "Stress leads to wrong direction.", "question_category": "MATCHING_FEATURES", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "r2-18", "question_number": 18, "question_text": "More severe at present than future.", "question_category": "MATCHING_FEATURES", "answer_input_type": "TEXT_INPUT", "options": [] },
                    { "id": "r2-19", "question_number": 19, "question_text": "NOT mentioned by Plumridge?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o19a", "label": "A", "text": "family time", "order": 1 }, { "id": "o19b", "label": "B", "text": "concentration", "order": 2 }, { "id": "o19c", "label": "C", "text": "sleep", "order": 3 }, { "id": "o19d", "label": "D", "text": "appointment", "order": 4 }] },
                    { "id": "r2-20", "question_number": 20, "question_text": "Solution NOT mentioned?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o20a", "label": "A", "text": "personnels", "order": 1 }, { "id": "o20b", "label": "B", "text": "more time", "order": 2 }, { "id": "o20c", "label": "C", "text": "lower expectation", "order": 3 }, { "id": "o20d", "label": "D", "text": "sports/massage", "order": 4 }] },
                    { "id": "r2-21", "question_number": 21, "question_text": "Jan Eisner view?", "question_category": "MCQ_SINGLE", "answer_input_type": "RADIO_SINGLE", "options": [{ "id": "o21a", "label": "A", "text": "Medical test part", "order": 1 }, { "id": "o21b", "label": "B", "text": "Body samples", "order": 2 }, { "id": "o21c", "label": "C", "text": "Emotional superior", "order": 3 }, { "id": "o21d", "label": "D", "text": "One solution", "order": 4 }] },
                    { "id": "r2-22", "question_number": 22, "question_text": "Stress plays important role in ______.", "question_category": "SUMMARY_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 2, "options": [] },
                    { "id": "r2-23", "question_number": 23, "question_text": "Staffs take ______ for absence.", "question_category": "SUMMARY_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 2, "options": [] },
                    { "id": "r2-24", "question_number": 24, "question_text": "Insurer wrote ______ of claims.", "question_category": "SUMMARY_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 2, "options": [] },
                    { "id": "r2-25", "question_number": 25, "question_text": "Sports such as ______, massage.", "question_category": "SUMMARY_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 2, "options": [] },
                    { "id": "r2-26", "question_number": 26, "question_text": "Specialists recommended ______ workload.", "question_category": "SUMMARY_COMPLETION", "answer_input_type": "TEXT_INPUT", "word_limit": 2, "options": [] }
                ]
            }
        ]
    },
    "writing_test": {
        "id": "78ee9f5d-e9f9-4785-b86b-6de2aa12f1b9",
        "duration_minutes": 60,
        "instructions": "The Writing section has two tasks. You must complete both tasks. For Task 1, you will be presented with a graph, table, chart or diagram and asked to summarise or explain the information in your own words. You should write at least 150 words. For Task 2, you will be given a point of view, argument or problem and asked to write an essay in response. You should write at least 250 words. You are recommended to spend about 20 minutes on Task 1 and about 40 minutes on Task 2. Your answers will be assessed on your ability to organise ideas, use appropriate vocabulary and grammar, and address the task fully.",
        "tasks": [
            {
                "id": "20ac225f-0c90-400e-839a-da6de7587e6b",
                "task_number": 1,
                "task_type": "WRITING_TASK_1_ACADEMIC",
                "title": "Task 1 - UK Residents Travel Survey",
                "prompt": "The chart below shows the results of a survey of UK residents about the types of travel they used for holidays in 2019. Summarise the information by selecting and reporting the main features, and make comparisons where relevant. Write at least 150 words. [Chart description: Bar chart titled 'Types of travel used for holidays (UK, 2019)'. Categories: Plane 45%, Car 32%, Train 12%, Coach 6%, Other 5%.] The table below gives a breakdown of the same survey by age group. Younger respondents (18–34) used planes most frequently (52%), while those aged 55 and over preferred the car (41%). Train use was highest among 35–54 year olds (18%).",
                "min_words": 150,
                "suggested_time": 20
            },
            {
                "id": "wt2",
                "task_number": 2,
                "task_type": "WRITING_TASK_2_ACADEMIC",
                "title": "Task 2 - Bad Situation vs Improvement",
                "prompt": "Some people believe that it is best to accept a bad situation, such as an unsatisfactory job or shortage of money. Others argue that it is better to try and improve such situations. Discuss both these views and give your own opinion. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Write at least 250 words.",
                "min_words": 250,
                "suggested_time": 40
            }
        ]
    }
};
