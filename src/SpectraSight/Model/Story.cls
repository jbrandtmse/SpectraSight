Class SpectraSight.Model.Story Extends SpectraSight.Model.Ticket
{

Property AcceptanceCriteria As %String(%JSONFIELDNAME = "acceptanceCriteria", MAXLEN = 32000);

Property StoryPoints As %Integer(%JSONFIELDNAME = "storyPoints");

Storage Default
{
<Data name="StoryDefaultData">
<Subscript>"Story"</Subscript>
<Value name="1">
<Value>AcceptanceCriteria</Value>
</Value>
<Value name="2">
<Value>StoryPoints</Value>
</Value>
</Data>
<DefaultData>StoryDefaultData</DefaultData>
<Type>%Storage.Persistent</Type>
}

}
