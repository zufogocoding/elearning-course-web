const prisma = require('../lib/prisma');

const getQuizzesByLesson = async (req, res) => {};
const createQuiz = async (req, res) => {};
const updateQuiz = async (req, res) => {};
const deleteQuiz = async (req, res) => {};

const getQuestionsByQuiz = async (req, res) => {};
const createQuestion = async (req, res) => {};
const updateQuestion = async (req, res) => {};
const deleteQuestion = async (req, res) => {};

module.exports = {
  getQuizzesByLesson,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  createQuestion,
  updateQuestion,
  deleteQuestion,
};