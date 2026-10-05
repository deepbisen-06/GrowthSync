import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import MetricCard from "../components/MetricCard";
import PerformanceChart from "../components/PerformanceChart";
import GrowthOverview from "../components/GrowthOverview";
import GrowthJourney from "../components/GrowthJourney";
import RecentActivityCard from "../components/RecentActivityCard";
import Alert from "../components/Alert";
import DashboardData from "../components/DashboardData";
import ModelEvaluationCards from "../components/ModelEvaluationCards";
import {
  DollarSign,
  BookOpen,
  Activity,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage({ setCurrentRoute }) {
  const { user } = useAuth();

  const [financialRecords, setFinancialRecords] = useState([]);
  const [studyRecords, setStudyRecords] = useState([]);
  const [habitRecords, setHabitRecords] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");

  // Fetch all user growth data in parallel
  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        setError("");
        const [finRes, stdRes, hbtRes, actRes, sumRes] = await Promise.all([
          api.get("/api/financial-records"),
          api.get("/api/study-records"),
          api.get("/api/habit-records"),
          api.get("/api/activity-history"),
          api.get("/api/datasets/summary"),
        ]);

        if (isMounted) {
          setFinancialRecords(finRes.data || []);
          setStudyRecords(stdRes.data || []);
          setHabitRecords(hbtRes.data || []);
          setActivities(actRes.data || []);
          setSummary(sumRes.data || {});
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.formattedMessage || "Failed to load growth dashboard metrics.",
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Metric 1: Financial Health calculation
  const latestFinancial = financialRecords[0];
  const savingsRate =
    latestFinancial && latestFinancial.monthly_income > 0
      ? Math.round(
          (latestFinancial.monthly_savings / latestFinancial.monthly_income) *
            100,
        )
      : null;

  // Metric 2: Study Progress calculation
  const totalStudyHours = studyRecords.reduce(
    (acc, curr) => acc + (curr.study_hours || 0),
    0,
  );

  // Metric 3: Habit Consistency calculation
  const avgSleep =
    habitRecords.length > 0
      ? (
          habitRecords.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) /
          habitRecords.length
        ).toFixed(1)
      : null;

  // Total records
  const totalRecordsLogged =
    financialRecords.length + studyRecords.length + habitRecords.length;

  return (
    <div className="dashboard-content">
      {/* 1. Dynamic Greeting Hero */}
      <div className="dashboard-hero">
        <div className="hero-title-area">
          <h1>
            {getGreeting()}, {user?.full_name?.split(" ")[0] || "Friend"} 👋
          </h1>
          <p className="hero-subtitle">
            Here's what's happening with your personal growth today.
          </p>
        </div>

        <div className="hero-quick-actions">
          <button
            onClick={() => setCurrentRoute("financial")}
            className="btn btn-secondary btn-sm"
          >
            <DollarSign size={14} className="text-emerald-400" />
            <span>+ Finance</span>
          </button>
          <button
            onClick={() => setCurrentRoute("study")}
            className="btn btn-secondary btn-sm"
          >
            <BookOpen size={14} className="text-blue-400" />
            <span>+ Study</span>
          </button>
          <button
            onClick={() => setCurrentRoute("habit")}
            className="btn btn-secondary btn-sm"
          >
            <Activity size={14} className="text-purple-400" />
            <span>+ Habit</span>
          </button>
          <button
            onClick={() => setCurrentRoute("forecasting")}
            className="btn btn-primary btn-sm"
          >
            <TrendingUp size={14} />
            <span>AI Forecasting &rarr;</span>
          </button>

        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError("")} />
      )}

      <button className="btn btn-secondary btn-sm" disabled={loading} onClick={() => setRefresh(v => v + 1)}>{loading ? "Loading your data…" : "Refresh dashboard"}</button>
      {/* 2. 4 KPI Metric Cards */}
      <div className="metrics-grid">
        {/* Card 1: Financial Health */}
        <MetricCard
          title="Financial Health"
          value={
            latestFinancial
              ? `${latestFinancial.monthly_savings.toLocaleString()}`
              : "—"
          }
          unit={latestFinancial ? "/ mo" : ""}
          trendText={
            savingsRate !== null ? `${savingsRate}% Rate` : "No data yet"
          }
          trendType={
            savingsRate !== null && savingsRate >= 20 ? "positive" : "neutral"
          }
          subtext={
            latestFinancial ? "Monthly savings · saved currency units" : "Log financial records"
          }
          icon={DollarSign}
          colorVariant="emerald"
          sparklineData={
            financialRecords.length > 0
              ? financialRecords.map((r) => r.monthly_savings).reverse()
              : [0, 0]
          }
        />

        {/* Card 2: Study Progress */}
        <MetricCard
          title="Study Progress"
          value={totalStudyHours > 0 ? `${totalStudyHours.toFixed(1)}` : "0"}
          unit="hrs"
          trendText={
            studyRecords.length > 0
              ? `${studyRecords.length} Sessions`
              : "No logs"
          }
          trendType={studyRecords.length > 0 ? "positive" : "neutral"}
          subtext={
            studyRecords.length > 0
              ? "Total Study Logged"
              : "Log study sessions"
          }
          icon={BookOpen}
          colorVariant="blue"
          sparklineData={
            studyRecords.length > 0
              ? studyRecords.map((r) => r.study_hours).reverse()
              : [0, 0]
          }
        />

        {/* Card 3: Habit Consistency */}
        <MetricCard
          title="Habit Consistency"
          value={avgSleep !== null ? `${avgSleep}` : "0"}
          unit="hrs sleep"
          trendText={
            habitRecords.length > 0 ? `${habitRecords.length} Days` : "No logs"
          }
          trendType={habitRecords.length > 0 ? "positive" : "neutral"}
          subtext={
            habitRecords.length > 0 ? "Daily Sleep Avg" : "Track daily habits"
          }
          icon={Activity}
          colorVariant="purple"
          sparklineData={
            habitRecords.length > 0
              ? habitRecords.map((r) => r.sleep_hours).reverse()
              : [0, 0]
          }
        />

        {/* Card 4: Growth Activity */}
        <MetricCard
          title="Growth Activity"
          value={`${totalRecordsLogged}`}
          unit="entries"
          trendText={
            activities.length > 0 ? `${activities.length} Events` : "Active"
          }
          trendType="positive"
          subtext="Stored in PostgreSQL"
          icon={Sparkles}
          colorVariant="orange"
          sparklineData={
            []
          }
        />
      </div>

      <DashboardData financial={financialRecords} study={studyRecords} habits={habitRecords} setCurrentRoute={setCurrentRoute} />

      <ModelEvaluationCards />

      {/* 3. Analytics Main Grid (Performance Line Chart + Growth Overview Donut) */}
      <div className="analytics-main-grid">
        <PerformanceChart
          studyRecords={studyRecords}
          habitRecords={habitRecords}
          setCurrentRoute={setCurrentRoute}
        />

        <GrowthOverview
          summary={summary || {}}
          counts={{
            financial: financialRecords.length,
            study: studyRecords.length,
            habit: habitRecords.length,
            activity: activities.length,
          }}
        />
      </div>

      {/* 4. Secondary Grid (Growth Journey Funnel + Recent Activity Feed) */}
      <div className="journey-activity-grid">
        <GrowthJourney
          hasFinancial={financialRecords.length > 0}
          hasStudy={studyRecords.length > 0}
          hasHabits={habitRecords.length > 0}
          totalRecords={totalRecordsLogged}
          setCurrentRoute={setCurrentRoute}
        />

        <RecentActivityCard
          activities={activities}
          setCurrentRoute={setCurrentRoute}
          maxItems={5}
        />
      </div>
    </div>
  );
}
