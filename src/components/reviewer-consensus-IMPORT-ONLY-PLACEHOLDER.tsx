import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Minus,
  RefreshCw,
  Youtube,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shimmer } from "@/components/motion";
import {
  getReviewerConsensus,
  refreshReviewerConsensus,
} from "@/lib/youtube/server";
import type { PackageReviewConsensus, Sentiment } from "@/lib/youtube/types";
import { getSeededConsensus } from "@/lib/youtube/get-seeded";
import { cn } from "@/lib/utils";
