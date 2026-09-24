import { useEffect, useState } from "react";
import { API_URL } from "@/config";
import { authHeaders } from "@/api/authHeaders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BaseTabLayout from "@/components/layouts/BaseTabLayout";
import { TabSectionRow } from "@/components/layouts/TabSectionRow";
import { TabSection } from "@/components/layouts/TabSection";
import CreateBlockDialog from "@/components/ui/CreateBlockDialog";
import BlockLibrary from "@/components/ui/BlockLibrary";
import CentralContentFilter from "@/components/ui/CentralContentFilter";
import BookSectionFilter from "@/components/ui/BookSectionFilter";
import DeleteBlockDialog from "@/components/ui/DeleteBlockDialog";
import CreateBlockFromExcelDialog from "@/components/ui/CreateBlockFromExcelDialog";
import { getBlockIssues } from "@/utils/getQuestionIssues";
import { AlertCircle, Check, RotateCcw, Search } from "lucide-react";

export default function BlockBankTab({
    openTab,
    blockRefreshKey
}) {

    const [blocks, setBlocks] = useState([]);
    const [blockToDelete, setBlockToDelete] = useState(null);
    const [importBlocksOpen, setImportBlocksOpen] = useState(false);

    // "none" | "content" | "book"
    const [activeFilterSource, setActiveFilterSource] = useState("none");

    const [contentFilter, setContentFilter] = useState({
        subjectId: "",
        levelId: "",
        areaId: "",
        centralContentId: ""
    });

    const [bookFilter, setBookFilter] = useState({
        bookId: "",
        chapterId: "",
        subchapterId: "",
        sectionId: ""
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [onlyWithIssues, setOnlyWithIssues] = useState(false);

    useEffect(() => {
        loadBlocks();
    }, [blockRefreshKey]);

    const [
        createBlockOpen,
        setCreateBlockOpen
    ] = useState(false);

    const loadBlocks = async () => {

        const res = await fetch(
            `${API_URL}/api/blocks/`,
            {
                headers: authHeaders()
            }
        );

        const data = await res.json();
        setBlocks(data);

    };

    const deleteBlock = async () => {

        await fetch(
            `${API_URL}/api/blocks/${blockToDelete}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        setBlockToDelete(null);

        loadBlocks();

    };

    const handleContentFilterChange = (newFilter) => {
        setContentFilter(newFilter);
        const hasValues = Boolean(
            newFilter.subjectId ||
            newFilter.levelId ||
            newFilter.areaId ||
            newFilter.centralContentId
        );
        if (hasValues) {
            setActiveFilterSource("content");
            // Nollställ det andra filtret så endast ett är aktivt åt gången
            setBookFilter({
                bookId: "",
                chapterId: "",
                subchapterId: "",
                sectionId: ""
            });
        } else if (activeFilterSource === "content") {
            setActiveFilterSource("none");
        }
    };

    const handleBookFilterChange = (newFilter) => {
        setBookFilter(newFilter);
        const hasValues = Boolean(
            newFilter.bookId ||
            newFilter.chapterId ||
            newFilter.subchapterId ||
            newFilter.sectionId
        );
        if (hasValues) {
            setActiveFilterSource("book");
            // Nollställ det andra filtret så endast ett är aktivt åt gången
            setContentFilter({
                subjectId: "",
                levelId: "",
                areaId: "",
                centralContentId: ""
            });
        } else if (activeFilterSource === "book") {
            setActiveFilterSource("none");
        }
    };

    const hasActiveFilters = Boolean(
        activeFilterSource !== "none" ||
        searchQuery.trim() ||
        onlyWithIssues
    );

    const resetFilters = () => {
        setActiveFilterSource("none");
        setContentFilter({
            subjectId: "",
            levelId: "",
            areaId: "",
            centralContentId: ""
        });
        setBookFilter({
            bookId: "",
            chapterId: "",
            subchapterId: "",
            sectionId: ""
        });
        setSearchQuery("");
        setOnlyWithIssues(false);
    };

    const filteredBlocks = blocks.filter(block => {

        // 1. Centralt innehåll filter (om aktivt)
        if (activeFilterSource === "content") {
            if (contentFilter.centralContentId) {
                const matchesCC = (block.centralContent || []).some(
                    cc => Number(cc.id) === Number(contentFilter.centralContentId)
                );
                if (!matchesCC) return false;
            } else if (contentFilter.areaId) {
                const matchesArea =
                    (block.areas || []).some(a => Number(a.id) === Number(contentFilter.areaId)) ||
                    (block.centralContent || []).some(cc => Number(cc.area_id) === Number(contentFilter.areaId));
                if (!matchesArea) return false;
            } else if (contentFilter.levelId) {
                const targetLevel = Number(contentFilter.levelId);
                const matchesLevel =
                    (block.courses || []).some(c => Number(c.id) === targetLevel) ||
                    (block.levels || []).some(l => Number(l.id) === targetLevel) ||
                    (block.bookSections || []).some(s => Number(s.course_level_id) === targetLevel) ||
                    (block.areas || []).some(a => Number(a.level_id) === targetLevel) ||
                    (block.points || []).some(p => Number(p.level_id) === targetLevel);
                if (!matchesLevel) return false;
            } else if (contentFilter.subjectId) {
                const targetSubject = Number(contentFilter.subjectId);
                const matchesSubject =
                    (block.subjects || []).some(s => Number(s.id) === targetSubject) ||
                    (block.bookSections || []).some(s => Number(s.subject_id) === targetSubject) ||
                    (block.abilities || []).some(a => Number(a.subject_id) === targetSubject);
                if (!matchesSubject) return false;
            }
        }

        // 2. Boksektion filter (om aktivt)
        if (activeFilterSource === "book") {
            if (bookFilter.sectionId) {
                const matchesSection = (block.bookSections || []).some(
                    section => Number(section.id) === Number(bookFilter.sectionId)
                );
                if (!matchesSection) return false;
            } else if (bookFilter.subchapterId) {
                const targetSubchapter = Number(bookFilter.subchapterId);
                const matchesSubchapter =
                    (block.subchapters || []).some(sc => Number(sc.id) === targetSubchapter) ||
                    (block.bookSections || []).some(s => Number(s.subchapter_id) === targetSubchapter);
                if (!matchesSubchapter) return false;
            } else if (bookFilter.chapterId) {
                const targetChapter = Number(bookFilter.chapterId);
                const matchesChapter =
                    (block.chapters || []).some(c => Number(c.id) === targetChapter) ||
                    (block.bookSections || []).some(s => Number(s.chapter_id) === targetChapter);
                if (!matchesChapter) return false;
            } else if (bookFilter.bookId) {
                const targetBook = Number(bookFilter.bookId);
                const matchesBook =
                    (block.books || []).some(b => Number(b.id) === targetBook) ||
                    (block.bookSections || []).some(s => Number(s.book_id) === targetBook);
                if (!matchesBook) return false;
            }
        }

        // 3. Fritextsökning
        if (searchQuery.trim()) {
            const query = searchQuery.trim().toLowerCase();
            const idMatch = String(block.id).includes(query);
            const titleMatch = (block.title || "").toLowerCase().includes(query);
            const questionMatch = (block.questions || []).some(
                q => (q.question || "").toLowerCase().includes(query)
            );
            const bookMatch = (block.books || []).some(
                b => (b.title || "").toLowerCase().includes(query)
            );
            const courseMatch = (block.courses || []).some(
                c => (c.name || "").toLowerCase().includes(query)
            );

            if (!idMatch && !titleMatch && !questionMatch && !bookMatch && !courseMatch) {
                return false;
            }
        }

        // 4. Endast block med fel
        if (onlyWithIssues) {
            const issues = getBlockIssues(block);
            if (issues.length === 0) {
                return false;
            }
        }

        return true;
    });

    const totalIssuesInAllBlocks = blocks.reduce(
        (sum, b) => sum + getBlockIssues(b).length,
        0
    );

    return (
        <>

            <BaseTabLayout

                title={`Blockbank (${filteredBlocks.length}${filteredBlocks.length !== blocks.length ? ` av ${blocks.length}` : ""})`}

                actions={
                    <div className="flex flex-wrap gap-2">

                        <Button
                            variant="outline"
                            onClick={() =>
                                setCreateBlockOpen(
                                    true
                                )
                            }
                        >
                            Skapa eget block
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() =>
                                setImportBlocksOpen(
                                    true
                                )
                            }
                        >
                            Importera från Excel
                        </Button>

                    </div>
                }

            >

                <div className="space-y-4">

                    <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border">
                        <div className="flex flex-1 min-w-64 max-w-md items-center gap-2 relative">
                            <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Sök block ID, frågetext, bok eller kurs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 input-standard w-full bg-background"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant={onlyWithIssues ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => setOnlyWithIssues(!onlyWithIssues)}
                                className="gap-1.5"
                            >
                                <AlertCircle size={14} />
                                <span>Endast med fel ({totalIssuesInAllBlocks})</span>
                            </Button>

                            {hasActiveFilters && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="gap-1 text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw size={14} />
                                    <span>Återställ filter</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    <TabSectionRow>

                        <TabSection
                            title="Centralt innehåll"
                            active={activeFilterSource === "content"}
                            badge={
                                activeFilterSource === "content" ? (
                                    <Badge variant="default" className="text-[11px] gap-1 py-0 px-2 bg-primary text-primary-foreground">
                                        <Check size={12} />
                                        Aktivt filter
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Inaktivt</span>
                                )
                            }
                        >

                            <CentralContentFilter
                                contentFilter={contentFilter}
                                onFilterChange={handleContentFilterChange}
                            />

                        </TabSection>

                        <TabSection
                            title="Boksektion"
                            active={activeFilterSource === "book"}
                            badge={
                                activeFilterSource === "book" ? (
                                    <Badge variant="default" className="text-[11px] gap-1 py-0 px-2 bg-primary text-primary-foreground">
                                        <Check size={12} />
                                        Aktivt filter
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Inaktivt</span>
                                )
                            }
                        >

                            <BookSectionFilter
                                bookFilter={bookFilter}
                                onFilterChange={handleBookFilterChange}
                            />

                        </TabSection>

                    </TabSectionRow>

                </div>

                <BlockLibrary
                    blocks={filteredBlocks}
                    dragPrefix="library"
                    openTab={openTab}
                    onDelete={setBlockToDelete}
                    onReload={loadBlocks}
                />

            </BaseTabLayout>

            <CreateBlockDialog
                open={createBlockOpen}
                onOpenChange={
                    setCreateBlockOpen
                }
                onCreated={loadBlocks}
            />

            <DeleteBlockDialog
                open={blockToDelete !== null}
                onOpenChange={(open) => {

                    if (!open) {
                        setBlockToDelete(null);
                    }

                }}
                onDelete={deleteBlock}
            />

            <CreateBlockFromExcelDialog
                open={importBlocksOpen}
                onOpenChange={setImportBlocksOpen}
                onImported={loadBlocks}
            />
        </>
    );
}